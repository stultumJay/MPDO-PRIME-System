from sqlalchemy import Column, DateTime, Float, String, Text, ForeignKey, Date, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class Project(Base):
    __tablename__ = "project"

    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    sector_id = Column(UUID(as_uuid=True), ForeignKey("sector.sector_id"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("program.program_id"), nullable=False)
    office_id = Column(UUID(as_uuid=True), ForeignKey("office.office_id"), nullable=False)

    fiscal_year = Column(String(4), nullable=False)
    project_code = Column(String(20), nullable=False, unique=True)

    project_title = Column(String(255), nullable=False)
    project_description = Column(Text)

    barangay = Column(String(100))
    street = Column(String(150))

    location_lat = Column(Float)
    location_lng = Column(Float)

    status = Column(String(20), nullable=False, default="planned")

    created_by = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)

    expected_start_date = Column(Date)
    expected_end_date   = Column(Date)
    actual_start_date   = Column(Date)
    actual_end_date     = Column(Date)

    is_integrated = Column(Boolean, nullable=False, default=False, server_default="false")
    locational_clearance_status = Column(Boolean, nullable=False, default=False, server_default="false")
    locational_clearance_reference_no = Column(String(100), nullable=True)
    locational_clearance_checked_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    is_active  = Column(Boolean, nullable=False, default=True)

    # RELATIONSHIPS
    sector = relationship("Sector", back_populates="projects")
    program = relationship("Program", back_populates="projects")
    office = relationship("Office", back_populates="projects")

    aips = relationship("ProjectAIP", back_populates="project")
    progress_logs = relationship("Progress", back_populates="project")
    issues = relationship("Issue", back_populates="project")
