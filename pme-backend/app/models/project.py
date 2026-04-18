from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=False)

    project_code = Column(String(50))
    project_title = Column(String(255), nullable=False)

    barangay = Column(String(100))
    street = Column(String(150))
    latitude = Column(Float)
    longitude = Column(Float)

    status = Column(String(50))

    created_at = Column(DateTime, default=datetime.utcnow)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)

    is_active = Column(Boolean, default=True)

    program = relationship("Program", back_populates="projects")
    project_aips = relationship("ProjectAIP", back_populates="project")
    issues = relationship("ProjectIssueLog", back_populates="project")