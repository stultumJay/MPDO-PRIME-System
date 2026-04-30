from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Appropriation
class AppropriationBase(BaseModel):
    project_aip_id: int
    fiscal_year: int
    ao_number: Optional[str]
    budget_type: Optional[str]
    total_amount: int


class AppropriationCreate(AppropriationBase):
    created_by: int


class AppropriationOut(AppropriationBase):
    appropriation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# AppropriationFundSource
class ApprFundSourceBase(BaseModel):
    appropriation_id: int
    fund_source_id: int
    expense_class: str
    appropriated_amount: int


class ApprFundSourceOut(ApprFundSourceBase):
    appr_fund_source_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Allotment
class AllotmentBase(BaseModel):
    appr_fund_source_id: int
    appropriation_id: int
    aro_number: Optional[str]
    aro_type: Optional[str]
    authorized_amount: int
    amount_released: int
    release_date: Optional[datetime]


class AllotmentOut(AllotmentBase):
    allotment_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Obligation
class ObligationBase(BaseModel):
    allotment_id: int
    payee: Optional[str]
    reference_document: Optional[str]
    obligation_amount: int
    obligation_date: Optional[datetime]
    fiscal_year: int
    quarter: int
    remarks: Optional[str]


class ObligationOut(ObligationBase):
    obligation_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True


# Disbursement
class DisbursementBase(BaseModel):
    obligation_id: int
    payment_method: Optional[str]
    reference_number: Optional[str]
    disbursement_amount: int
    disbursement_date: Optional[datetime]
    fiscal_year: int
    quarter: int
    remarks: Optional[str]


class DisbursementOut(DisbursementBase):
    disbursement_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True