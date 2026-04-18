from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Appropriation(Base):
    __tablename__ = "appropriations"

    appropriation_id = Column(Integer, primary_key=True, autoincrement=True)

    project_aip_id = Column(Integer, ForeignKey("project_aip.project_aip_id"))

    fiscal_year = Column(Integer)
    ao_number = Column(String(100))

    total_amount = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer)

    project_aip = relationship("ProjectAIP", back_populates="appropriations")

    allotments = relationship("Allotment", back_populates="appropriation")
    fund_sources = relationship("AppropriationFundSource", back_populates="appropriation")