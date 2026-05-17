from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.performance import Performance
from app.models.project_aip import ProjectAIP
from app.schemas.performance import PerformanceCreate, PerformanceUpdate, PerformanceResponse


def _get_or_404(db: Session, performance_id: UUID) -> Performance:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(Performance).filter(
        Performance.performance_id == performance_id
    ).first()
    if not row:
        raise HTTPException(404, "Performance record not found.")
    return row


def create_performance(db: Session, data: PerformanceCreate) -> PerformanceResponse:
    """
    This creates the performance record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    aip = None

    if data.project_aip_id:
        aip = db.query(ProjectAIP).filter(ProjectAIP.project_aip_id == data.project_aip_id).first()
        if not aip:
            raise HTTPException(404, "AIP entry not found.")
    elif data.project_id and data.fiscal_year:
        aip = (
            db.query(ProjectAIP)
            .filter(
                ProjectAIP.project_id == data.project_id,
                ProjectAIP.fiscal_year == data.fiscal_year,
                ProjectAIP.is_active.is_(True),
            )
            .first()
        )

    values = data.model_dump(
        exclude={
            "project_aip_id",
            "project_id",
            "fiscal_year",
            "performance_remarks",
        }
    )

    if aip and aip.performance:
        for field, value in values.items():
            setattr(aip.performance, field, value)
        db.commit()
        db.refresh(aip.performance)
        return PerformanceResponse.model_validate(aip.performance)

    perf = Performance(**values)
    db.add(perf)
    db.flush()
    if aip:
        aip.performance_id = perf.performance_id

    db.commit()
    db.refresh(perf)
    return PerformanceResponse.model_validate(perf)


def get_performances(db: Session) -> List[PerformanceResponse]:
    """
    This gets the performances data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    rows = db.query(Performance).order_by(Performance.created_at.desc()).all()
    return [PerformanceResponse.model_validate(r) for r in rows]


def get_performance(db: Session, performance_id: UUID) -> PerformanceResponse:
    """
    This gets the performance data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return PerformanceResponse.model_validate(_get_or_404(db, performance_id))


def update_performance(
    db: Session, performance_id: UUID, data: PerformanceUpdate
) -> PerformanceResponse:
    """
    This updates the performance record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    perf = _get_or_404(db, performance_id)
    updates = data.model_dump(exclude_unset=True)

    next_target_total = updates.get("target_total", perf.target_total or 0)
    next_target_q1 = updates.get("target_q1", perf.target_q1 or 0)
    next_target_q2 = updates.get("target_q2", perf.target_q2 or 0)
    next_target_q3 = updates.get("target_q3", perf.target_q3 or 0)
    next_target_q4 = updates.get("target_q4", perf.target_q4 or 0)
    next_quarter_total = next_target_q1 + next_target_q2 + next_target_q3 + next_target_q4

    if next_target_total and next_quarter_total > next_target_total:
        raise HTTPException(
            400,
            f"Quarterly targets sum to {next_quarter_total} but target_total is {next_target_total}.",
        )

    for field, value in updates.items():
        setattr(perf, field, value)
    db.commit()
    db.refresh(perf)
    return PerformanceResponse.model_validate(perf)


def delete_performance(db: Session, performance_id: UUID) -> dict:
    """
    This removes or deactivates the performance record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    perf = _get_or_404(db, performance_id)
    db.delete(perf)
    db.commit()
    return {"detail": "Performance record deleted."}
