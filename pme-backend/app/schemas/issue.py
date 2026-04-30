from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Optional


class IssueCreate(BaseModel):
    project_id: UUID
    issue_name: str
    issue_category: str
    issue_description: str
    date_reported: Optional[date] = None


class IssueResolve(BaseModel):
    corrective_action: str
    resolved_date: date
    resolved_by: str


class IssueOut(BaseModel):
    issue_id: UUID
    project_id: UUID

    issue_name: str
    issue_category: str
    issue_description: str

    status: str
    date_reported: date

    corrective_action: Optional[str] = None
    resolved_date: Optional[date] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True