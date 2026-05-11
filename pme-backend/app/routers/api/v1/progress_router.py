from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount

from app.services.progress_service import (
    create_progress,
    get_project_progress,
    update_progress,
    delete_progress,
)

from app.schemas.progress import ProgressCreate, ProgressUpdate

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/")
def create(
    payload: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
):
    """
    This route creates the create flow and passes the request into the service layer
    It expects project_id as UUID, phase_id as UUID, and new_percent as Decimal
    It can also receive remarks as Optional[str]
    """
    return create_progress(db, payload, current_user)


@router.get("/project/{project_id}")
def get_by_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the get by project data the caller asked for
    """
    return get_project_progress(db, project_id)


@router.put("/{progress_id}")
def update(
    progress_id: UUID,
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route updates the update flow and passes the request into the service layer
    It can also receive new_percent as Optional[Decimal] and remarks as Optional[str]
    """
    return update_progress(db, progress_id, payload)


@router.delete("/{progress_id}")
def delete(
    progress_id: UUID,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route removes the delete flow and lets the service decide whether it should be deleted or deactivated
    """
    return delete_progress(db, progress_id)