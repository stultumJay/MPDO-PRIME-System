from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, subqueryload, contains_eager

from sqlalchemy import or_

from app.models.office import Office
from app.models.performance import Performance
from app.models.program import Program
from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.schemas.aip import (
    AIPCreate, AIPUpdate,
    AIPResponse,
    LBPForm4Row, LBPForm4ProgramGroup, LBPForm4Response,
)
from app.utils.aip_code import build_aip_reference_code

_Z = Decimal("0.00")


def _d(v) -> Decimal:
    """
    This handles the  d flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    return Decimal(str(v)) if v is not None else _Z


def _load_aip(db: Session, project_aip_id: UUID) -> ProjectAIP:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    aip = (
        db.query(ProjectAIP)
        .options(
            subqueryload(ProjectAIP.project),
            subqueryload(ProjectAIP.performance),
        )
        .filter(ProjectAIP.project_aip_id == project_aip_id)
        .first()
    )
    if not aip:
        raise HTTPException(404, "AIP entry not found.")
    return aip


def create_aip_entry(db: Session, data: AIPCreate) -> AIPResponse:
    # Pseudo-code guide
    # First make sure the project exists and is still active
    # Then block duplicate active AIP entries for the same project and fiscal year
    # Then generate the AIP code, create performance data, create the AIP row, and commit together
    """
    This creates the aip entry record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    project = db.query(Project).filter(
        Project.project_id == data.project_id,
        Project.is_active.is_(True),
    ).first()
    if not project:
        raise HTTPException(404, "Project not found or inactive.")

    if db.query(ProjectAIP).filter(
        ProjectAIP.project_id  == data.project_id,
        ProjectAIP.fiscal_year == data.fiscal_year,
        ProjectAIP.is_active.is_(True),
    ).first():
        raise HTTPException(
            409,
            f"Project already has an active AIP entry for FY{data.fiscal_year}.",
        )

    # This creates the visible AIP code and now resets the final NNN segment per program
    aip_ref = build_aip_reference_code(db, data.project_id, data.fiscal_year)

    # Performance is created with the AIP entry so targets and budget planning stay connected
    performance = Performance(
        performance_indicator = data.performance_indicator,
        target_total          = data.target_total,
        target_q1             = data.target_q1,
        target_q2             = data.target_q2,
        target_q3             = data.target_q3,
        target_q4             = data.target_q4,
        remarks               = data.performance_remarks,
    )
    db.add(performance)
    db.flush()

    # FIX: was propose_budget_* (missing 'd') — correct column names are proposed_budget_*
    aip = ProjectAIP(
        project_id           = data.project_id,
        performance_id       = performance.performance_id,
        fiscal_year          = data.fiscal_year,
        aip_reference_code   = aip_ref,
        major_final_output   = data.major_final_output,
        proposed_budget_ps   = data.proposed_budget_ps,
        proposed_budget_mooe = data.proposed_budget_mooe,
        proposed_budget_fe   = data.proposed_budget_fe,
        proposed_budget_co   = data.proposed_budget_co,
        is_active            = True,
    )
    db.add(aip)
    # Once a project has an active AIP row, the project is considered integrated
    project.is_integrated = True
    db.commit()
    return AIPResponse.model_validate(_load_aip(db, aip.project_aip_id))


def get_aip_list(
    db:          Session,
    fiscal_year: Optional[int]  = None,
    office_id:   Optional[UUID] = None,
    sector_id:   Optional[UUID] = None,
    q:           Optional[str]  = None,
    active_only: bool = True,
    skip:        int  = 0,
    limit:       int  = 100,
) -> List[AIPResponse]:
    """
    This gets the aip list data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    needs_project_join = office_id is not None or sector_id is not None or q is not None
 
    if needs_project_join:
        query = (
            db.query(ProjectAIP)
            .join(Project, ProjectAIP.project_id == Project.project_id)
            .options(
                contains_eager(ProjectAIP.project)
                .subqueryload(Project.office),
                subqueryload(ProjectAIP.performance),
            )
        )
    else:
        query = db.query(ProjectAIP).options(
            subqueryload(ProjectAIP.project)
            .subqueryload(Project.office),
            subqueryload(ProjectAIP.performance),
        )
        
    if office_id:
        query = query.filter(Project.office_id == office_id)
    if sector_id:
        query = query.filter(Project.sector_id == sector_id)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Project.project_title.ilike(pattern),
                ProjectAIP.aip_reference_code.ilike(pattern),
            )
        )

    if active_only:
        query = query.filter(ProjectAIP.is_active.is_(True))
    if fiscal_year:
        query = query.filter(ProjectAIP.fiscal_year == fiscal_year)

    entries = query.order_by(ProjectAIP.aip_reference_code).offset(skip).limit(limit).all()
    return [AIPResponse.model_validate(e) for e in entries]


def get_fiscal_years(db: Session) -> list[int]:
    """Distinct fiscal years that have at least one active AIP entry, newest first."""
    rows = (
        db.query(ProjectAIP.fiscal_year)
        .filter(ProjectAIP.is_active.is_(True))
        .distinct()
        .order_by(ProjectAIP.fiscal_year.desc())
        .all()
    )
    return [r[0] for r in rows]


def get_aip_entry(db: Session, project_aip_id: UUID) -> AIPResponse:
    """
    This gets the aip entry data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return AIPResponse.model_validate(_load_aip(db, project_aip_id))


def update_aip_entry(
    db:             Session,
    project_aip_id: UUID,
    data:           AIPUpdate,
) -> AIPResponse:
    # Pseudo-code guide
    # Load the active AIP row first
    # Apply only the fields the caller sent
    # Split updates between the AIP table and the linked performance table
    # Keep fiscal year and AIP reference code unchanged
    """
    This updates the aip entry record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    aip = db.query(ProjectAIP).filter(
        ProjectAIP.project_aip_id == project_aip_id,
        ProjectAIP.is_active.is_(True),
    ).first()
    if not aip:
        raise HTTPException(404, "Active AIP entry not found.")

    updates = data.model_dump(exclude_unset=True)

    # FIX: correct column names
    for f in (
        "major_final_output",
        "proposed_budget_ps", "proposed_budget_mooe",
        "proposed_budget_fe", "proposed_budget_co",
    ):
        if f in updates:
            setattr(aip, f, updates[f])

    _PERF = {
        "performance_indicator": "performance_indicator",
        "target_total":  "target_total",
        "target_q1": "target_q1", "target_q2": "target_q2",
        "target_q3": "target_q3", "target_q4": "target_q4",
        "actual_q1": "actual_q1", "actual_q2": "actual_q2",
        "actual_q3": "actual_q3", "actual_q4": "actual_q4",
        "performance_remarks": "remarks",
    }
    if aip.performance:
        for sk, mk in _PERF.items():
            if sk in updates:
                setattr(aip.performance, mk, updates[sk])

    db.commit()
    return AIPResponse.model_validate(_load_aip(db, project_aip_id))


def delete_aip_entry(db: Session, project_aip_id: UUID) -> dict:
    """
    This removes or deactivates the aip entry record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    aip = db.query(ProjectAIP).filter(
        ProjectAIP.project_aip_id == project_aip_id,
        ProjectAIP.is_active.is_(True),
    ).first()
    if not aip:
        raise HTTPException(404, "AIP entry not found or already deactivated.")
    aip.is_active = False
    remaining_active = db.query(ProjectAIP).filter(
        ProjectAIP.project_id == aip.project_id,
        ProjectAIP.project_aip_id != aip.project_aip_id,
        ProjectAIP.is_active.is_(True),
    ).first()
    if not remaining_active and aip.project:
        aip.project.is_integrated = False
    db.commit()
    return {
        "detail": f"AIP entry '{aip.aip_reference_code}' deactivated.",
        "aip_reference_code": aip.aip_reference_code,
    }


# ── LBP Form No. 4 ────────────────────────────────────────────────────────

def get_lbp_form4(
    db:          Session,
    fiscal_year: int,
    office_id:   UUID,
) -> LBPForm4Response:
    # Pseudo-code guide
    # Find the office header first
    # Get every active AIP entry for that office and fiscal year
    # Group rows by program so the form can show program subtotals
    # Add all program subtotals together for the grand total
    """
    This gets the lbp form4 data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    office = db.query(Office).filter(Office.office_id == office_id).first()
    if not office:
        raise HTTPException(404, "Office not found.")

    entries: List[ProjectAIP] = (
        db.query(ProjectAIP)
        .join(Project, ProjectAIP.project_id == Project.project_id)
        .join(Program, Project.program_id    == Program.program_id)
        .filter(
            Project.office_id          == office_id,
            ProjectAIP.fiscal_year     == fiscal_year,
            ProjectAIP.is_active.is_(True),
        )
        .options(
            contains_eager(ProjectAIP.project).contains_eager(Project.program),
            subqueryload(ProjectAIP.performance),
        )
        .order_by(Program.program_code, ProjectAIP.aip_reference_code)
        .all()
    )

    buckets: dict[UUID, dict] = {}
    for entry in entries:
        prog = entry.project.program
        pid  = prog.program_id
        if pid not in buckets:
            buckets[pid] = {
                "program_code": prog.program_code,
                "program_name": prog.program_name,
                "rows": [],
            }

        # FIX: correct field names proposed_budget_*
        ps   = _d(entry.proposed_budget_ps)
        mooe = _d(entry.proposed_budget_mooe)
        fe   = _d(entry.proposed_budget_fe)
        co   = _d(entry.proposed_budget_co)
        perf = entry.performance

        buckets[pid]["rows"].append(LBPForm4Row(
            aip_reference_code     = entry.aip_reference_code,
            program_code           = prog.program_code,
            program_name           = prog.program_name,
            project_code           = entry.project.project_code,
            project_title          = entry.project.project_title,
            project_description    = entry.project.project_description,
            major_final_output     = entry.major_final_output,
            performance_indicator  = perf.performance_indicator  if perf else None,
            target_for_budget_year = perf.target_total           if perf else None,
            target_q1              = perf.target_q1              if perf else None,
            target_q2              = perf.target_q2              if perf else None,
            target_q3              = perf.target_q3              if perf else None,
            target_q4              = perf.target_q4              if perf else None,
            proposed_budget_ps     = ps,
            proposed_budget_mooe   = mooe,
            proposed_budget_fe     = fe,
            proposed_budget_co     = co,
            proposed_budget_total  = ps + mooe + fe + co,
        ))

    groups: List[LBPForm4ProgramGroup] = []
    gps = gmooe = gfe = gco = _Z

    for b in buckets.values():
        rows  = b["rows"]
        sps   = sum((r.proposed_budget_ps   for r in rows), _Z)
        smooe = sum((r.proposed_budget_mooe for r in rows), _Z)
        sfe   = sum((r.proposed_budget_fe   for r in rows), _Z)
        sco   = sum((r.proposed_budget_co   for r in rows), _Z)
        groups.append(LBPForm4ProgramGroup(
            program_code   = b["program_code"],
            program_name   = b["program_name"],
            rows           = rows,
            subtotal_ps    = sps,
            subtotal_mooe  = smooe,
            subtotal_fe    = sfe,
            subtotal_co    = sco,
            subtotal_total = sps + smooe + sfe + sco,
        ))
        gps += sps; gmooe += smooe; gfe += sfe; gco += sco

    return LBPForm4Response(
        fiscal_year            = fiscal_year,
        department_office      = office.office_name,
        mandate                = office.mandate,
        vision                 = office.vision,
        mission                = office.mission,
        organizational_outcome = office.organizational_outcome,
        programs               = groups,
        total_ps               = gps,
        total_mooe             = gmooe,
        total_fe               = gfe,
        total_co               = gco,
        grand_total            = gps + gmooe + gfe + gco,
    )