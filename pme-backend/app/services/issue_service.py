from typing import List, Optional
from uuid import UUID
from datetime import date

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueResolve, IssueOut


# ─────────────────────────────
# CREATE ISSUE
# ─────────────────────────────
def create_issue(db: Session, data: IssueCreate) -> IssueOut:
    """
    This creates the issue record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    issue = Issue(
        project_id=data.project_id,
        issue_title=data.issue_name,
        severity=data.issue_category,
        corrective_action=data.issue_description,
        status="open",
        date_reported=data.date_reported or date.today(),
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)

    return IssueOut.model_validate(issue)


# ─────────────────────────────
# GET PROJECT ISSUES
# ─────────────────────────────
def get_project_issues(
    db: Session,
    project_id: UUID,
    status: Optional[str] = None,
) -> List[IssueOut]:

    """
    This gets the project issues data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Issue).filter(Issue.project_id == project_id)

    if status:
        q = q.filter(Issue.status == status)

    rows = q.order_by(Issue.date_reported.desc()).all()

    return [IssueOut.model_validate(r) for r in rows]


# ─────────────────────────────
# GET ALL ISSUES
# ─────────────────────────────
def get_all_issues(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[IssueOut]:

    """
    This gets the all issues data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Issue)

    if category:
        q = q.filter(Issue.severity == category)

    if status:
        q = q.filter(Issue.status == status)

    rows = (
        q.order_by(Issue.date_reported.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [IssueOut.model_validate(r) for r in rows]


# ─────────────────────────────
# RESOLVE ISSUE
# ─────────────────────────────
def resolve_issue(
    db: Session,
    issue_id: UUID,
    payload: IssueResolve,
) -> IssueOut:

    """
    This resolves the issue flow after loading the current record
    It saves the closing details so the rest of the system can treat the issue as finished
    """
    issue = db.query(Issue).filter(Issue.issue_id == issue_id).first()

    if not issue:
        raise HTTPException(404, "Issue not found.")

    if issue.status == "resolved":
        raise HTTPException(400, "Issue already resolved.")

    issue.status = "resolved"
    issue.corrective_action = payload.corrective_action

    db.commit()
    db.refresh(issue)

    return IssueOut.model_validate(issue)