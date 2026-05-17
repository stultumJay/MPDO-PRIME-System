from decimal import Decimal
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_

from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.progress import Progress
from app.models.disbursement import Disbursement
from app.models.obligation import Obligation
from app.models.allotment import Allotment
from app.models.finance import AppropriationFundSource, Appropriation
from app.models.sector import Sector

_Z = Decimal("0.00")


# ─────────────────────────────────────────────
# DASHBOARD METRICS  (used by analytics_router)
# ─────────────────────────────────────────────
def get_dashboard_metrics(db: Session, fiscal_year: int | None = None) -> dict:
    """
    This builds the top level dashboard counts and money summary for the chosen fiscal year
    When no fiscal year is passed, it rolls everything up across the active AIP rows instead
    """
    # The first subquery decides which projects belong to the requested AIP year
    aip_project_q = db.query(ProjectAIP.project_id).filter(ProjectAIP.is_active.is_(True))
    if fiscal_year is not None:
        aip_project_q = aip_project_q.filter(ProjectAIP.fiscal_year == fiscal_year)
    aip_project_ids = aip_project_q.subquery()

    total     = db.query(Project).filter(Project.project_id.in_(aip_project_ids)).count()
    ongoing   = db.query(Project).filter(Project.project_id.in_(aip_project_ids), Project.status == "ongoing").count()
    completed = db.query(Project).filter(Project.project_id.in_(aip_project_ids), Project.status == "completed").count()
    delayed   = db.query(Project).filter(Project.project_id.in_(aip_project_ids), Project.status == "delayed").count()

    # Walk the full financial chain for this fiscal year:
    # project_aip → appropriation → appr_fund_source → allotment → obligation → disbursement
    aip_ids_q = db.query(ProjectAIP.project_aip_id).filter(ProjectAIP.is_active.is_(True))
    if fiscal_year is not None:
        aip_ids_q = aip_ids_q.filter(ProjectAIP.fiscal_year == fiscal_year)
    aip_ids = aip_ids_q.subquery()

    appr_ids = db.query(Appropriation.appropriation_id).filter(
        Appropriation.project_aip_id.in_(aip_ids), Appropriation.is_active.is_(True)
    ).subquery()

    afs_ids = db.query(AppropriationFundSource.appr_fund_source_id).filter(
        AppropriationFundSource.appropriation_id.in_(appr_ids)
    ).subquery()

    allot_ids = db.query(Allotment.allotment_id).filter(
        Allotment.appr_fund_source_id.in_(afs_ids)
    ).subquery()

    oblig_ids = db.query(Obligation.obligation_id).filter(
        Obligation.allotment_id.in_(allot_ids)
    ).subquery()

    allocated: Decimal = db.query(
        func.coalesce(func.sum(Allotment.amount_released), _Z)
    ).filter(Allotment.allotment_id.in_(allot_ids)).scalar() or _Z

    disbursed: Decimal = db.query(
        func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
    ).filter(Disbursement.obligation_id.in_(oblig_ids)).scalar() or _Z

    utilization = round(float(disbursed / allocated * 100), 2) if allocated else 0.0

    return {
        "fiscal_year":           fiscal_year,
        "total_projects":        total,
        "ongoing":               ongoing,
        "completed":             completed,
        "delayed":               delayed,
        "utilization_percent":   utilization,
        "funds_utilized_amount": disbursed,
    }

# ─────────────────────────────────────────────
# PROJECT STATUS DISTRIBUTION
# ─────────────────────────────────────────────
def get_project_status_distribution(db: Session, fiscal_year: int) -> list:
    """
    This counts how many projects fall into each status for one fiscal year
    It also adds the percentage so the chart can show both count and share
    """
    aip_project_ids = (
        db.query(ProjectAIP.project_id)
        .filter(ProjectAIP.fiscal_year == fiscal_year, ProjectAIP.is_active.is_(True))
        .subquery()
    )

    rows = (
        db.query(Project.status, func.count(Project.project_id).label("count"))
        .filter(Project.project_id.in_(aip_project_ids))
        .group_by(Project.status)
        .all()
    )

    total = sum(r.count for r in rows) or 1
    return [
        {
            "status":     r.status,
            "count":      r.count,
            "percentage": round(r.count / total * 100, 2),
        }
        for r in rows
    ]


# ─────────────────────────────────────────────
# SECTOR IMPACT  (for dashboard bar chart)
# ─────────────────────────────────────────────
def get_sector_impact(db: Session, fiscal_year: int | None = None) -> list:
    """
    This counts how many projects belong to each sector for the chosen fiscal year
    The result is sorted from the busiest sector down to the least busy one
    """
    q = db.query(ProjectAIP.project_id).filter(ProjectAIP.is_active.is_(True))
    if fiscal_year is not None:
        q = q.filter(ProjectAIP.fiscal_year == fiscal_year)
    aip_project_ids = q.subquery()

    rows = (
        db.query(Sector.sector_name, func.count(Project.project_id).label("count"))
        .join(Project, Project.sector_id == Sector.sector_id)
        .filter(Project.project_id.in_(aip_project_ids))
        .group_by(Sector.sector_id, Sector.sector_name)
        .order_by(func.count(Project.project_id).desc())
        .all()
    )

    return [{"sector": r.sector_name, "count": r.count} for r in rows]