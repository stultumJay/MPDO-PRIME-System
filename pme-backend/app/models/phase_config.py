from sqlalchemy import Column, Integer, String, Boolean
from .base import Base

class PhaseConfig(Base):
    __tablename__ = "phase_config"

    phase_config_id = Column(Integer, primary_key=True, autoincrement=True)
    phase_name = Column(String(100))
    weight_percent = Column(Integer)

    is_active = Column(Boolean, default=True)