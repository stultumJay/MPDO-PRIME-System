from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.phase_config import PhaseConfig
from app.models.progress import Progress
from app.models.project import Project

_ZERO = Decimal("0.00")
_COMPLETE = Decimal("100.00")


def recompute_project_status(
    db: Session,
    project_or_id: Project | UUID,
    *,
    commit: bool = False,
) -> Project | None:
    """
    Derive project status from phase progress logs.
    Delayed is intentionally not inferred here because there is no business rule for it yet.
    """
    project = (
        project_or_id
        if isinstance(project_or_id, Project)
        else db.query(Project).filter(Project.project_id == project_or_id).first()
    )
    if not project:
        return None

    phases = db.query(PhaseConfig.phase_id).all()
    phase_ids = [phase_id for (phase_id,) in phases]

    if not phase_ids:
        computed_status = "planned"
    else:
        phase_maxes = []
        for phase_id in phase_ids:
            current = (
                db.query(func.coalesce(func.max(Progress.new_percent), _ZERO))
                .filter(
                    Progress.project_id == project.project_id,
                    Progress.phase_id == phase_id,
                )
                .scalar()
                or _ZERO
            )
            phase_maxes.append(Decimal(str(current)))

        has_progress = any(percent > _ZERO for percent in phase_maxes)
        is_completed = bool(phase_maxes) and all(percent >= _COMPLETE for percent in phase_maxes)

        if is_completed:
            computed_status = "completed"
        elif has_progress:
            computed_status = "in_progress"
        else:
            computed_status = "planned"

    first_progress_at = (
        db.query(func.min(Progress.logged_at))
        .filter(
            Progress.project_id == project.project_id,
            Progress.new_percent > _ZERO,
        )
        .scalar()
    )
    last_completion_at = (
        db.query(func.max(Progress.logged_at))
        .filter(
            Progress.project_id == project.project_id,
            Progress.new_percent >= _COMPLETE,
        )
        .scalar()
    )

    project.status = computed_status
    project.actual_start_date = first_progress_at.date() if first_progress_at else None
    project.actual_end_date = last_completion_at.date() if computed_status == "completed" and last_completion_at else None

    if commit:
        db.commit()
        db.refresh(project)

    return project