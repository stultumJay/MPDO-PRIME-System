from decimal import Decimal
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.phase_config import PhaseConfig
from app.schemas.phase_config import (
    PhaseConfigCreate, PhaseConfigUpdate,
    PhaseConfigResponse, PhaseWeightSummary,
)

_Z = Decimal("0.00")


def _get_or_404(db: Session, phase_id: UUID) -> PhaseConfig:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(PhaseConfig).filter(PhaseConfig.phase_id == phase_id).first()
    if not row:
        raise HTTPException(404, "Phase config not found.")
    return row


def create_phase_config(db: Session, data: PhaseConfigCreate) -> PhaseConfigResponse:
    """
    This creates the phase config record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    if db.query(PhaseConfig).filter(PhaseConfig.phase_name == data.phase_name).first():
        raise HTTPException(400, f"Phase '{data.phase_name}' already exists.")

    phase = PhaseConfig(**data.model_dump())
    db.add(phase)
    db.commit()
    db.refresh(phase)
    return PhaseConfigResponse.model_validate(phase)


def get_phase_configs(db: Session) -> List[PhaseConfigResponse]:
    """
    This gets the phase configs data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    rows = (
        db.query(PhaseConfig)
        .all()
    )
    return [PhaseConfigResponse.model_validate(r) for r in rows]


def get_phase_config(db: Session, phase_id: UUID) -> PhaseConfigResponse:
    """
    This gets the phase config data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return PhaseConfigResponse.model_validate(_get_or_404(db, phase_id))


def update_phase_config(
    db: Session, phase_id: UUID, data: PhaseConfigUpdate
) -> PhaseConfigResponse:
    """
    This updates the phase config record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    phase = _get_or_404(db, phase_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(phase, field, value)
    db.commit()
    db.refresh(phase)
    return PhaseConfigResponse.model_validate(phase)


def delete_phase_config(db: Session, phase_id: UUID) -> dict:
    """
    This removes or deactivates the phase config record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    phase = _get_or_404(db, phase_id)
    db.delete(phase)
    db.commit()
    return {"detail": f"Phase '{phase.phase_name}' deleted."}


def get_weight_summary(db: Session) -> PhaseWeightSummary:
    """
    This gets the weight summary data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    total = db.query(
        func.coalesce(func.sum(PhaseConfig.weight_percent), _Z)).scalar() or _Z
    active_phases = db.query(func.count(PhaseConfig.phase_id)).scalar() or 0

    return PhaseWeightSummary(
        total_weight  = total,
        is_balanced   = total == Decimal("100"),
        active_phases = active_phases
        )
