from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Sector(Base):
    __tablename__ = "sectors"

    sector_id = Column(Integer, primary_key=True, autoincrement=True)
    sector_code = Column(String(20), unique=True, nullable=False)
    sector_name = Column(String(255), nullable=False)
    description = Column(Text)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sub_sectors = relationship("SubSector", back_populates="sector")