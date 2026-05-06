from sqlalchemy import Column, Numeric, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base


class Progress(Base):
    __tablename__ = "progress"

    progress_id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id       = Column(UUID(as_uuid=True), ForeignKey("project.project_id"),     nullable=False)
    phase_id         = Column(UUID(as_uuid=True), ForeignKey("phase_config.phase_id"),  nullable=False)

    previous_percent = Column(Numeric(5, 2), nullable=False, default=0)
    new_percent      = Column(Numeric(5, 2), nullable=False)
    remarks          = Column(Text,          nullable=True)

    logged_by  = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)
    logged_at  = Column(DateTime, nullable=False, server_default=func.now())

    project = relationship("Project",     back_populates="progress_logs")
    phase   = relationship("PhaseConfig", back_populates="progress_logs")