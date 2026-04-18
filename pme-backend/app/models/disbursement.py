from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Disbursement(Base):
    __tablename__ = "disbursements"

    disbursement_id = Column(Integer, primary_key=True, autoincrement=True)

    obligation_id = Column(Integer, ForeignKey("obligations.obligation_id"))

    payment_method = Column(String(50))
    reference_number = Column(String(100))

    disbursement_amount = Column(Integer)

    disbursement_date = Column(DateTime)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    fiscal_year = Column(Integer)

    remarks = Column(Text)

    created_by = Column(Integer)

    obligation = relationship("Obligation", back_populates="disbursements")