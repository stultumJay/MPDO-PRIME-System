from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Obligation(Base):
    __tablename__ = "obligations"

    obligation_id = Column(Integer, primary_key=True, autoincrement=True)

    allotment_id = Column(Integer, ForeignKey("allotments.allotment_id"))

    payee = Column(String(255))
    reference_document = Column(String(255))

    obligation_amount = Column(Integer)

    obligation_date = Column(DateTime)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    fiscal_year = Column(Integer)
    quarter = Column(Integer)

    remarks = Column(Text)

    created_by = Column(Integer)

    allotment = relationship("Allotment", back_populates="obligations")
    disbursements = relationship("Disbursement", back_populates="obligation")