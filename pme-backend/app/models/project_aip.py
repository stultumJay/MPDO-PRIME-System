from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Text, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class ProjectAIP(Base):
    __tablename__ = "project_aip"

    project_aip_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("project.project_id"))
    performance_id = Column(UUID(as_uuid=True), ForeignKey("performance.performance_id"), nullable=True)

    fiscal_year = Column(Integer, nullable=False)
    aip_reference_code = Column(String(50), nullable=False)

    proposed_budget_ps = Column(Numeric(14,2))
    proposed_budget_mooe = Column(Numeric(14,2))
    proposed_budget_fe = Column(Numeric(14,2))
    proposed_budget_co = Column(Numeric(14,2))

    major_final_output = Column(Text)
    
    is_active  = Column(Boolean,  nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True,  onupdate=func.now())

    project = relationship("Project", back_populates="aips")
    appropriations = relationship("Appropriation", back_populates="project_aip")
    performance = relationship("Performance", back_populates="project_aips",foreign_keys=[performance_id])