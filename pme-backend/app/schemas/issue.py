from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class IssueBase(BaseModel):
    project_id: int
    issue_title: str
    issue_description: Optional[str]
    severity: Optional[str]
    status: Optional[str]
    date_reported: Optional[datetime]


class IssueCreate(IssueBase):
    pass


class IssueOut(IssueBase):
    issue_id: int
    date_logged: datetime
    resolution_notes: Optional[str]
    resolved_by: Optional[int]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True