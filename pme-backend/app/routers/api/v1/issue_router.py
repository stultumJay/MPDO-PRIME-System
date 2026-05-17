from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount

from app.schemas.issue import IssueCreate, IssueResolve
from app.services.issue_service import (
    create_issue,
    get_all_issues,
    get_project_issues,
    resolve_issue,
)

router = APIRouter(prefix="/issues", tags=["Issues"])


# ─────────────────────────────
# CREATE
# ─────────────────────────────
@router.post("/")
def create(
    payload: IssueCreate,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route creates the create flow and passes the request into the service layer
    It expects project_id as UUID, issue_name as str, issue_category as str, and issue_description as str
    It can also receive date_reported as Optional[date]
    """
    return create_issue(db, payload)


# ─────────────────────────────
# LIST ALL
# ─────────────────────────────
@router.get("/")
def list_issues(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list issues data the caller asked for
    """
    return get_all_issues(
        db,
        category=category,
        status=status,
        skip=(page - 1) * size,
        limit=size,
    )


# ─────────────────────────────
# GET PROJECT ISSUES
# ─────────────────────────────
@router.get("/project/{project_id}")
def get_by_project(
    project_id: UUID,
    status: Optional[str] = Query(None),  # open / resolved
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the get by project data the caller asked for
    """
    return get_project_issues(db, project_id, status=status)


# ─────────────────────────────
# RESOLVE ISSUE
# ─────────────────────────────
@router.put("/{issue_id}/resolve")
def resolve(
    issue_id: UUID,
    payload: IssueResolve,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route updates the resolve flow and passes the request into the service layer
    It expects corrective_action as str, resolved_date as date, and resolved_by as str
    """
    return resolve_issue(db, issue_id, payload)