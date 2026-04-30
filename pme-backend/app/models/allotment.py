from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Allotment(Base):
    __tablename__ = "allotments"

    allotment_id = Column(Integer, primary_key=True, autoincrement=True)

    appr_fund_source_id = Column(Integer, ForeignKey("appropriation_fund_sources.appr_fund_source_id"))
    appropriation_id = Column(Integer, ForeignKey("appropriations.appropriation_id"))

    aro_number = Column(String(100))
    aro_type = Column(String(50))

    authorized_amount = Column(Integer)
    amount_released = Column(Integer)

    release_date = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer)

    appropriation = relationship("Appropriation", back_populates="allotments")
    appr_fund_source = relationship("AppropriationFundSource", back_populates="allotments")

    obligations = relationship("Obligation", back_populates="allotment")