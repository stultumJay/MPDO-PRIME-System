from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from .base import Base

class ProjectIssueLog(Base):
    __tablename__ = "project_issue_logs"

    issue_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"))

    issue_title = Column(String(255))
    issue_description = Column(Text)

    severity = Column(String(50))
    status = Column(String(50))

    date_reported = Column(DateTime)
    date_logged = Column(DateTime, default=datetime.utcnow)

    resolution_notes = Column(Text)
    resolved_by = Column(Integer)
    resolved_at = Column(DateTime)