from sqlalchemy import Column, String, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class Issue(Base):
    __tablename__ = "issue"

    issue_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("project.project_id"), nullable=False)

    issue_title = Column(String(255), nullable=False)
    severity = Column(String(100), nullable=False)

    status = Column(String(20), default="open")

    date_reported = Column(Date, nullable=False)

    corrective_action = Column(Text, nullable=True)

    project = relationship("Project", back_populates="issues")

    @property
    def issue_name(self):
        return self.issue_title

    @issue_name.setter
    def issue_name(self, value):
        self.issue_title = value

    @property
    def issue_category(self):
        return self.severity

    @issue_category.setter
    def issue_category(self, value):
        self.severity = value

    @property
    def issue_description(self):
        return self.corrective_action or ""

    @issue_description.setter
    def issue_description(self, value):
        self.corrective_action = value

    @property
    def resolved_date(self):
        return None

    @property
    def resolved_by(self):
        return None