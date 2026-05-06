from sqlalchemy import Column, String, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class PhaseConfig(Base):
    __tablename__ = "phase_config"

    phase_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phase_name = Column(String(50), nullable=False)
    weight_percent = Column(Numeric(5,2), nullable=False)

    progress_logs = relationship("Progress", back_populates="phase")