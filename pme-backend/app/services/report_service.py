from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, select

from typing import Optional
from fastapi import HTTPException

from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.performance import Performance
from app.models.program import Program
from app.models.sector import Sector
from app.models.office import Office
from app.models.progress import Progress
from app.models.finance import AppropriationFundSource, Appropriation
from app.models.allotment import Allotment
from app.models.obligation import Obligation
from app.models.disbursement import Disbursement

_Z = Decimal("0.00")


# ─────────────────────────────────────────────
# HELPER: financial totals for a set of project_aip ids
# ─────────────────────────────────────────────

def _financial_totals_for_aip_ids(db: Session, aip_ids_select):
    """
    Walk: project_aip → appropriation → appr_fund_source → allotment → obligation → disbursement.
    Returns (allotted, obligated, disbursed).
    """
    appr_ids = select(Appropriation.appropriation_id).where(
        Appropriation.project_aip_id.in_(aip_ids_select),
        Appropriation.is_active.is_(True),
    )

    afs_ids = select(AppropriationFundSource.appr_fund_source_id).where(
        AppropriationFundSource.appropriation_id.in_(appr_ids)
    )

    allot_ids = select(Allotment.allotment_id).where(
        Allotment.appr_fund_source_id.in_(afs_ids)
    )

    oblig_ids = select(Obligation.obligation_id).where(
        Obligation.allotment_id.in_(allot_ids)
    )

    allotted = db.query(
        func.coalesce(func.sum(Allotment.amount_released), _Z)
    ).filter(Allotment.allotment_id.in_(allot_ids)).scalar() or _Z

    obligated = db.query(
        func.coalesce(func.sum(Obligation.obligation_amount), _Z)
    ).filter(Obligation.obligation_id.in_(oblig_ids)).scalar() or _Z

    disbursed = db.query(
        func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
    ).filter(Disbursement.obligation_id.in_(oblig_ids)).scalar() or _Z

    return allotted, obligated, disbursed


# ─────────────────────────────────────────────
# LBP FORM NO. 4
# ─────────────────────────────────────────────
def generate_lbp_form_4(db: Session, office_id: UUID, fiscal_year: int):
    """
    This handles the generate lbp form 4 flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    # The office header is loaded first because the report cannot be built without knowing which office owns it
    office = db.query(Office).filter(Office.office_id == office_id).first()
    if not office:
        raise HTTPException(404, "Office not found.")

    # Performance is joined here so the report can show both the target and the indicator beside each AIP row
    rows = (
        db.query(
            Sector.sector_name,
            Program.program_name,
            Program.program_code,
            ProjectAIP.aip_reference_code,
            Project.project_title,
            ProjectAIP.major_final_output,
            Performance.performance_indicator,
            Performance.target_total,
            ProjectAIP.proposed_budget_ps,
            ProjectAIP.proposed_budget_mooe,
            ProjectAIP.proposed_budget_fe,
            ProjectAIP.proposed_budget_co,
        )
        .join(Project,     Project.project_id         == ProjectAIP.project_id)
        .join(Program,     Program.program_id          == Project.program_id)
        .join(Sector,      Sector.sector_id            == Project.sector_id)
        .outerjoin(Performance, Performance.performance_id == ProjectAIP.performance_id)
        .filter(
            Project.office_id      == office_id,
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
        .order_by(Sector.sector_name, Program.program_code)
        .all()
    )

    # The result is grouped by sector and then by program so the report reads the same way the planning structure works
    result: dict = {}
    for r in rows:
        sector  = r.sector_name
        program = r.program_name

        if sector not in result:
            result[sector] = {}
        if program not in result[sector]:
            result[sector][program] = []

        total = (
            (r.proposed_budget_ps   or 0)
            + (r.proposed_budget_mooe or 0)
            + (r.proposed_budget_fe   or 0)
            + (r.proposed_budget_co   or 0)
        )

        result[sector][program].append({
            "aip_code":             r.aip_reference_code,
            "project_title":        r.project_title,
            "mfo":                  r.major_final_output,
            "performance_indicator": r.performance_indicator,
            "target":               r.target_total,
            "ps":                   r.proposed_budget_ps,
            "mooe":                 r.proposed_budget_mooe,
            "fe":                   r.proposed_budget_fe,
            "co":                   r.proposed_budget_co,
            "total":                total,
        })

    return {
        "office": {
            "name":    office.office_name,
            "mandate": office.mandate,
            "vision":  office.vision,
            "mission": office.mission,
            "outcome": office.organizational_outcome,
        },
        "fiscal_year": fiscal_year,
        "data": result,
    }


# ─────────────────────────────────────────────
# LBAc FORM NO. 3 – QUARTERLY PHYSICAL REPORT
# ─────────────────────────────────────────────

def generate_quarterly_physical_report(
    db:          Session,
    office_id:   UUID,
    fiscal_year: int,
    quarter:     int,
):
    """
    This handles the generate quarterly physical report flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    # The chosen quarter decides which target and actual columns should be read from the performance row
    quarter_col = {
        1: Performance.target_q1,
        2: Performance.target_q2,
        3: Performance.target_q3,
        4: Performance.target_q4,
    }[quarter]

    actual_col = {
        1: Performance.actual_q1,
        2: Performance.actual_q2,
        3: Performance.actual_q3,
        4: Performance.actual_q4,
    }[quarter]

    rows = (
        db.query(
            ProjectAIP.aip_reference_code,
            Project.project_title,
            ProjectAIP.major_final_output,
            Performance.performance_indicator,
            quarter_col.label("target"),
            actual_col.label("actual"),
        )
        .join(Project,     Project.project_id          == ProjectAIP.project_id)
        .outerjoin(Performance, Performance.performance_id == ProjectAIP.performance_id)
        .filter(
            Project.office_id      == office_id,
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
        .all()
    )

    result = []
    for r in rows:
        target   = r.target   or 0
        actual   = r.actual   or 0
        variance = actual - target
        pct      = round((actual / target * 100), 2) if target else 0.0

        result.append({
            "ppa_code":  r.aip_reference_code,
            "project":   r.project_title,
            "mfo":       r.major_final_output,
            "indicator": r.performance_indicator,
            "target":    target,
            "actual":    actual,
            "variance":  variance,
            "percent":   pct,
            "remarks":   None,
        })

    return result


# ─────────────────────────────────────────────
# LBAc FORM NO. 5 – PHYSICAL & FINANCIAL PERF
# ─────────────────────────────────────────────

def generate_physical_financial_report(
    db:          Session,
    office_id:   UUID,
    fiscal_year: int,
    semester:    int,
):
    """
    This handles the generate physical financial report flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    # A semester is just a pair of quarters, so we decide that pair first and then reuse the same query shape
    quarters = [1, 2] if semester == 1 else [3, 4]

    base_rows = (
        db.query(
            ProjectAIP.project_aip_id,
            ProjectAIP.aip_reference_code,
            Project.project_id,
            Project.project_title,
            Performance.target_total,
            Performance.actual_q1,
            Performance.actual_q2,
            Performance.actual_q3,
            Performance.actual_q4,
        )
        .join(Project,     Project.project_id          == ProjectAIP.project_id)
        .outerjoin(Performance, Performance.performance_id == ProjectAIP.performance_id)
        .filter(
            Project.office_id      == office_id,
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
        .all()
    )

    result = []
    for r in base_rows:
        # Physical: sum actual for the semester quarters
        if semester == 1:
            actual_progress = (r.actual_q1 or 0) + (r.actual_q2 or 0)
        else:
            actual_progress = (r.actual_q3 or 0) + (r.actual_q4 or 0)

        target = r.target_total or 0

        # The financial side is calculated from the exact AIP row so one project year does not leak into another year
        aip_ids_select = select(ProjectAIP.project_aip_id).where(
            ProjectAIP.project_aip_id == r.project_aip_id
        )

        allotted, obligated, _ = _financial_totals_for_aip_ids(db, aip_ids_select)

        variance   = actual_progress - target
        pct        = round((actual_progress / target * 100), 2) if target else 0.0
        absorptive = round((float(obligated) / float(allotted) * 100), 2) if allotted else 0.0

        result.append({
            "ppa_code":           r.aip_reference_code,
            "project":            r.project_title,
            "target":             target,
            "actual":             actual_progress,
            "variance":           variance,
            "percent":            pct,
            "allotment":          allotted,
            "obligation":         obligated,
            "absorptive_capacity": absorptive,
        })

    return result


# ─────────────────────────────────────────────
# REPORT ROUTER ENDPOINTS
# ─────────────────────────────────────────────

def get_project_summary_report(db: Session, fiscal_year: int) -> list:
    """Project-level summary for the given fiscal year."""
    rows = (
        db.query(
            Project.project_id,
            Project.project_code,
            Project.project_title,
            Project.status,
            Sector.sector_name,
            ProjectAIP.project_aip_id,
            ProjectAIP.proposed_budget_ps,
            ProjectAIP.proposed_budget_mooe,
            ProjectAIP.proposed_budget_fe,
            ProjectAIP.proposed_budget_co,
        )
        .join(ProjectAIP, ProjectAIP.project_id == Project.project_id)
        .join(Sector,     Sector.sector_id       == Project.sector_id)
        .filter(
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
        .order_by(Sector.sector_name, Project.project_code)
        .all()
    )

    result = []
    for r in rows:
        aip_ids_select = select(ProjectAIP.project_aip_id).where(
            ProjectAIP.project_aip_id == r.project_aip_id
        )
        allotted, obligated, disbursed = _financial_totals_for_aip_ids(db, aip_ids_select)

        # Proposed budget is spread across four columns, so the report adds them into one easier total
        proposed = sum([
            Decimal(str(r.proposed_budget_ps   or 0)),
            Decimal(str(r.proposed_budget_mooe or 0)),
            Decimal(str(r.proposed_budget_fe   or 0)),
            Decimal(str(r.proposed_budget_co   or 0)),
        ])

        result.append({
            "project_code":  r.project_code,
            "project_title": r.project_title,
            "sector":        r.sector_name,
            "status":        r.status,
            "proposed":      proposed,
            "allotted":      allotted,
            "obligated":     obligated,
            "disbursed":     disbursed,
        })

    return result


def get_sector_summary_report(db: Session, fiscal_year: int) -> list:
    """Aggregate financial totals grouped by sector."""
    sectors = db.query(Sector).order_by(Sector.sector_name).all()
    result  = []

    for sector in sectors:
        # This subquery gathers only the AIP rows that belong to the current sector and fiscal year
        aip_ids_select = (
            select(ProjectAIP.project_aip_id)
            .select_from(ProjectAIP)
            .join(Project, ProjectAIP.project_id == Project.project_id)
            .where(
                Project.sector_id      == sector.sector_id,
                ProjectAIP.fiscal_year == fiscal_year,
                ProjectAIP.is_active.is_(True),
            )
        )

        project_count = (
            db.query(func.count(Project.project_id))
            .join(ProjectAIP, ProjectAIP.project_id == Project.project_id)
            .filter(
                Project.sector_id      == sector.sector_id,
                ProjectAIP.fiscal_year == fiscal_year,
                ProjectAIP.is_active.is_(True),
            )
            .scalar() or 0
        )

        allotted, obligated, disbursed = _financial_totals_for_aip_ids(db, aip_ids_select)

        result.append({
            "sector":         sector.sector_name,
            "project_count":  project_count,
            "allotted":       allotted,
            "obligated":      obligated,
            "disbursed":      disbursed,
        })

    return result


def get_office_performance_report(db: Session, office_id: UUID, fiscal_year: int) -> dict:
    """Physical and financial performance summary for one office."""
    office = db.query(Office).filter(Office.office_id == office_id).first()
    if not office:
        from fastapi import HTTPException
        raise HTTPException(404, "Office not found.")

    aip_ids_select = (
        select(ProjectAIP.project_aip_id)
        .select_from(ProjectAIP)
        .join(Project, ProjectAIP.project_id == Project.project_id)
        .where(
            Project.office_id      == office_id,
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
    )

    allotted, obligated, disbursed = _financial_totals_for_aip_ids(db, aip_ids_select)

    project_count = (
        db.query(func.count(Project.project_id))
        .join(ProjectAIP, ProjectAIP.project_id == Project.project_id)
        .filter(
            Project.office_id      == office_id,
            ProjectAIP.fiscal_year == fiscal_year,
        )
        .scalar() or 0
    )

    utilization = (
        round(float(disbursed / allotted * 100), 2) if allotted else 0.0
    )

    return {
        "office_name":    office.office_name,
        "fiscal_year":    fiscal_year,
        "project_count":  project_count,
        "allotted":       allotted,
        "obligated":      obligated,
        "disbursed":      disbursed,
        "utilization_pct": utilization,
    }
