from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class SubSector(Base):
    __tablename__ = "sub_sectors"

    sub_sector_id = Column(Integer, primary_key=True, autoincrement=True)
    sector_id = Column(Integer, ForeignKey("sectors.sector_id"), nullable=False)

    sub_sector_code = Column(String(20))
    sub_sector_name = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sector = relationship("Sector", back_populates="sub_sectors")