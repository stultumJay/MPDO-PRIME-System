from sqlalchemy import Column, String, ForeignKey, Numeric, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base


class Allotment(Base):
    __tablename__ = "allotment"

    allotment_id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appr_fund_source_id = Column(UUID(as_uuid=True), ForeignKey("appr_fund_source.appr_fund_source_id"), nullable=False)

    aro_number      = Column(String(50),     nullable=False)
    amount_released = Column(Numeric(14, 2), nullable=False)
    release_date    = Column(Date,           nullable=False)
    released_by     = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)
    remarks         = Column(String(500),    nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    appr_source  = relationship("AppropriationFundSource", back_populates="allotments")
    obligations  = relationship("Obligation", back_populates="allotment")