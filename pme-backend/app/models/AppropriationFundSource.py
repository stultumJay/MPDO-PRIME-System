from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class AppropriationFundSource(Base):
    __tablename__ = "appropriation_fund_sources"

    appr_fund_source_id = Column(Integer, primary_key=True, autoincrement=True)

    appropriation_id = Column(Integer, ForeignKey("appropriations.appropriation_id"))
    fund_source_id = Column(Integer, ForeignKey("fund_sources.fund_source_id"))

    expense_class = Column(String(10))
    appropriated_amount = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    appropriation = relationship("Appropriation", back_populates="fund_sources")
    fund_source = relationship("FundSource", back_populates="appropriation_links")

    allotments = relationship("Allotment", back_populates="appr_fund_source")