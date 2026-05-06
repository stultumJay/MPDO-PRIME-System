from sqlalchemy import Column, String, ForeignKey, Numeric, Date, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base


class Disbursement(Base):
    __tablename__ = "disbursement"

    disbursement_id     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obligation_id       = Column(UUID(as_uuid=True), ForeignKey("obligation.obligation_id"), nullable=False)

    payment_method      = Column(String(50),     nullable=False)  # cash | check | ADA
    reference_number    = Column(String(100),    nullable=True)
    disbursement_amount = Column(Numeric(14, 2), nullable=False)
    disbursement_date   = Column(Date,           nullable=False)
    remarks             = Column(Text,           nullable=True)
    created_by          = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)
    created_at          = Column(DateTime, nullable=False, server_default=func.now())

    obligation = relationship("Obligation", back_populates="disbursements")