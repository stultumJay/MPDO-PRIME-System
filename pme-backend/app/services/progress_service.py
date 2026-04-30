from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.phase_config import PhaseConfig
from app.models.progress import Progress
from app.models.project import Project
from app.schemas.progress import (
    ProgressCreate, ProgressUpdate, ProgressResponse,
    PhaseProgressSummary, ProjectProgressSummary,
)

_Z = Decimal("0.00")


def _get_or_404(db: Session, progress_id: UUID) -> Progress:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(Progress).filter(Progress.progress_id == progress_id).first()
    if not row:
        raise HTTPException(404, "Progress record not found.")
    return row


# ── CREATE ────────────────────────────────────────────────────────────────

def create_progress(db: Session, data: ProgressCreate) -> ProgressResponse:
    """
    Log a new progress entry for a project phase.
    Progress is forward-only — new_percent must be ≥ current maximum.
    """
    if not db.query(Project).filter(
        Project.project_id == data.project_id,
        Project.is_active.is_(True),
    ).first():
        raise HTTPException(404, "Project not found or inactive.")

    # FIX: PhaseConfig has no is_active column — removed that filter
    if not db.query(PhaseConfig).filter(
        PhaseConfig.phase_id == data.phase_id,
    ).first():
        raise HTTPException(404, "Phase config not found.")

    current_max: Decimal = db.query(
        func.coalesce(func.max(Progress.new_percent), _Z)
    ).filter(
        Progress.project_id == data.project_id,
        Progress.phase_id   == data.phase_id,
    ).scalar() or _Z

    if data.new_percent < current_max:
        raise HTTPException(
            400,
            f"Progress is forward-only. "
            f"Current: {current_max:.2f}%, Requested: {data.new_percent:.2f}%.",
        )

    log = Progress(
        project_id       = data.project_id,
        phase_id         = data.phase_id,
        previous_percent = current_max,
        new_percent      = data.new_percent,
        remarks          = data.remarks,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return ProgressResponse.model_validate(log)


# ── READ ──────────────────────────────────────────────────────────────────

def get_project_progress(db: Session, project_id: UUID) -> List[ProgressResponse]:
    """Return all progress logs for a project, newest first."""
    rows = (
        db.query(Progress)
        .filter(Progress.project_id == project_id)
        .order_by(Progress.logged_at.desc())
        .all()
    )
    return [ProgressResponse.model_validate(r) for r in rows]


def get_progress_summary(db: Session, project_id: UUID) -> ProjectProgressSummary:
    """
    Weighted overall completion across all phases.
    """
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.is_active.is_(True),
    ).first()
    if not project:
        raise HTTPException(404, "Project not found.")

    # FIX: removed order_index (not in model) and is_active filter
    phases = db.query(PhaseConfig).all()

    total_weight = sum(Decimal(str(p.weight_percent)) for p in phases) or Decimal("1")
    overall: Decimal = _Z
    phase_summaries: List[PhaseProgressSummary] = []

    for phase in phases:
        current: Decimal = db.query(
            func.coalesce(func.max(Progress.new_percent), _Z)
        ).filter(
            Progress.project_id == project_id,
            Progress.phase_id   == phase.phase_id,
        ).scalar() or _Z

        weight       = Decimal(str(phase.weight_percent))
        contribution = current * weight / Decimal("100")
        overall     += contribution * (weight / total_weight)

        phase_summaries.append(PhaseProgressSummary(
            phase_id              = phase.phase_id,
            phase_name            = phase.phase_name,
            weight_percent        = weight,
            current_percent       = Decimal(str(current)),
            weighted_contribution = contribution,
        ))

    return ProjectProgressSummary(
        project_id         = project.project_id,
        project_code       = project.project_code,
        overall_completion = round(overall, 2),
        phases             = phase_summaries,
    )


# ── UPDATE ────────────────────────────────────────────────────────────────

def update_progress(
    db:          Session,
    progress_id: UUID,
    data:        ProgressUpdate,
) -> ProgressResponse:
    """
    Only remarks can be freely edited.
    new_percent can only move forward (enforced here).
    """
    log = _get_or_404(db, progress_id)

    if data.new_percent is not None:
        if data.new_percent < log.new_percent:
            raise HTTPException(
                400,
                f"Cannot reduce progress. Current value: {log.new_percent:.2f}%.",
            )
        log.new_percent = data.new_percent

    if data.remarks is not None:
        log.remarks = data.remarks

    db.commit()
    db.refresh(log)
    return ProgressResponse.model_validate(log)


# ── DELETE ────────────────────────────────────────────────────────────────

def delete_progress(db: Session, progress_id: UUID) -> dict:
    """
    This removes or deactivates the progress record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    log = _get_or_404(db, progress_id)
    db.delete(log)
    db.commit()
    return {"detail": "Progress record deleted."}