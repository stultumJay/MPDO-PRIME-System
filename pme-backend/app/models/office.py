from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Office(Base):
    __tablename__ = "offices"

    office_id = Column(Integer, primary_key=True, autoincrement=True)
    office_code = Column(String(20), unique=True)
    office_type = Column(String(10))
    office_name = Column(String(255), nullable=False)

    mandate = Column(Text)
    vision = Column(Text)
    mission = Column(Text)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    programs = relationship("Program", back_populates="office")
    project_aips = relationship("ProjectAIP", back_populates="office")