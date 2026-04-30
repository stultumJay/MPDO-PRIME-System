from sqlalchemy import Column, String, ForeignKey, Numeric, Date, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base


class Obligation(Base):
    __tablename__ = "obligation"

    obligation_id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    allotment_id       = Column(UUID(as_uuid=True), ForeignKey("allotment.allotment_id"), nullable=False)

    payee              = Column(String(150),     nullable=False)
    reference_document = Column(String(100),     nullable=False)
    obligation_amount  = Column(Numeric(14, 2),  nullable=False)
    obligation_date    = Column(Date,            nullable=False)
    remarks            = Column(Text,            nullable=True)
    created_by         = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)
    created_at         = Column(DateTime, nullable=False, server_default=func.now())

    allotment    = relationship("Allotment",    back_populates="obligations")
    disbursements = relationship("Disbursement", back_populates="obligation")