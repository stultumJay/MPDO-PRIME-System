from sqlalchemy import (
    Column, String, ForeignKey, Numeric, Boolean,
    DateTime, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base


class FundSource(Base):
    __tablename__ = "fund_source"

    fund_source_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_category  = Column(String(50),  nullable=False)
    fund_name      = Column(String(150), nullable=False)
    description    = Column(String(255), nullable=True)

    is_active  = Column(Boolean,  nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    appropriation_sources = relationship(
        "AppropriationFundSource", back_populates="fund_source"
    )


class Appropriation(Base):
    __tablename__ = "appropriation"

    appropriation_id   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_aip_id     = Column(UUID(as_uuid=True), ForeignKey("project_aip.project_aip_id"), nullable=False)
    ao_number          = Column(String(50),  nullable=False)
    fiscal_year        = Column(String(4),   nullable=False)
    appropriation_date = Column(DateTime,    nullable=True)
    is_continuing      = Column(Boolean,     nullable=False, default=False)
    remarks            = Column(String(500), nullable=True)
    created_by         = Column(UUID(as_uuid=True), ForeignKey("user_account.user_id"), nullable=True)

    is_active  = Column(Boolean,  nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    project_aip  = relationship("ProjectAIP",             back_populates="appropriations")
    fund_sources = relationship("AppropriationFundSource", back_populates="appropriation")


class AppropriationFundSource(Base):
    __tablename__ = "appr_fund_source"

    appr_fund_source_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appropriation_id    = Column(UUID(as_uuid=True), ForeignKey("appropriation.appropriation_id"), nullable=False)
    fund_source_id      = Column(UUID(as_uuid=True), ForeignKey("fund_source.fund_source_id"),    nullable=False)
    # PS | MOOE | FE | CO  — enforced at service/schema layer
    expense_class       = Column(String(10), nullable=False)
    appropriated_amount = Column(Numeric(14, 2), nullable=False)
    created_at          = Column(DateTime, nullable=False, server_default=func.now())

    # A given appropriation cannot have duplicate (fund_source, expense_class) rows
    __table_args__ = (
        UniqueConstraint(
            "appropriation_id", "fund_source_id", "expense_class",
            name="uq_appr_fund_source_class",
        ),
    )

    appropriation = relationship("Appropriation",  back_populates="fund_sources")
    fund_source   = relationship("FundSource",     back_populates="appropriation_sources")
    allotments    = relationship("Allotment",      back_populates="appr_source")