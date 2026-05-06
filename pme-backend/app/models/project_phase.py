
from sqlalchemy import Column, Date, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
 
from .base import Base
 
 
class ProjectPhase(Base):
    """
    Per-project planned/actual dates for each configured phase.
    Decoupled from Progress logs (which capture completion %).
    """
    __tablename__ = "project_phase"
 
    project_phase_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id       = Column(UUID(as_uuid=True), ForeignKey("project.project_id"),    nullable=False)
    phase_id         = Column(UUID(as_uuid=True), ForeignKey("phase_config.phase_id"), nullable=False)
 
    planned_start = Column(Date, nullable=True)
    planned_end   = Column(Date, nullable=True)
    actual_start  = Column(Date, nullable=True)
    actual_end    = Column(Date, nullable=True)
    status        = Column(String(20), nullable=True)  # planned | in_progress | completed | delayed
 
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True,  onupdate=func.now())
 
    __table_args__ = (
        UniqueConstraint("project_id", "phase_id", name="uq_project_phase"),
    )
 
    project = relationship("Project")
    phase   = relationship("PhaseConfig")