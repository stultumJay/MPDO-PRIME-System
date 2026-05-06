from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.finance import (
    FundSourceCreate, FundSourceUpdate, FundSourceResponse,
    AppropriationCreate, AppropriationUpdate, AppropriationResponse,
    AppropriationFundSourceCreate, AppropriationFundSourceUpdate,
    AppropriationFundSourceResponse, ProjectFinancialLedger, ProjectFinancialSummary,
)
from app.services import finance_service

router = APIRouter(prefix="/finance", tags=["Finance"])


# ── Fund Source ────────────────────────────────────────────────────────────
@router.post("/fund-sources", response_model=FundSourceResponse, status_code=201)
def create_fund_source(data: FundSourceCreate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route creates the create fund source flow and passes the request into the service layer
    It expects fund_category as Optional[str], fund_name as Optional[str], and description as Optional[str]
    """
    return finance_service.create_fund_source(db, data)

@router.get("/fund-sources", response_model=List[FundSourceResponse])
def list_fund_sources(db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the list fund sources data the caller asked for
    """
    return finance_service.get_fund_sources(db)

@router.get("/fund-sources/{fund_source_id}", response_model=FundSourceResponse)
def get_fund_source(fund_source_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get fund source data the caller asked for
    """
    return FundSourceResponse.model_validate(finance_service.get_fund_source(db, fund_source_id))

@router.put("/fund-sources/{fund_source_id}", response_model=FundSourceResponse)
def update_fund_source(fund_source_id: UUID, data: FundSourceUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update fund source flow and passes the request into the service layer
    It can also receive fund_category as Optional[str], fund_name as Optional[str], description as Optional[str], and is_active as Optional[bool]
    """
    return finance_service.update_fund_source(db, fund_source_id, data)

@router.delete("/fund-sources/{fund_source_id}")
def delete_fund_source(fund_source_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete fund source flow and lets the service decide whether it should be deleted or deactivated
    """
    return finance_service.delete_fund_source(db, fund_source_id)


# ── Appropriation ──────────────────────────────────────────────────────────
@router.post("/appropriations", response_model=AppropriationResponse, status_code=201)
def create_appropriation(data: AppropriationCreate, db: Session = Depends(get_db), current_user: UserAccount = Depends(get_current_user)):
    """
    This route creates the create appropriation flow and passes the request into the service layer
    It expects project_aip_id as UUID, ao_number as str, and fiscal_year as str
    It can also receive appropriation_date as Optional[date], is_continuing as bool, and remarks as Optional[str]
    """
    return finance_service.create_appropriation(db, data, current_user)

@router.get("/appropriations", response_model=List[AppropriationResponse])
def list_appropriations(
    project_aip_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list appropriations data the caller asked for
    """
    return finance_service.get_appropriations(db, project_aip_id=project_aip_id)

@router.get("/appropriations/{appropriation_id}", response_model=AppropriationResponse)
def get_appropriation(appropriation_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get appropriation data the caller asked for
    """
    return AppropriationResponse.model_validate(finance_service.get_appropriation(db, appropriation_id))

@router.put("/appropriations/{appropriation_id}", response_model=AppropriationResponse)
def update_appropriation(appropriation_id: UUID, data: AppropriationUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update appropriation flow and passes the request into the service layer
    It can also receive ao_number as Optional[str], appropriation_date as Optional[date], is_continuing as Optional[bool], remarks as Optional[str], and is_active as Optional[bool]
    """
    return finance_service.update_appropriation(db, appropriation_id, data)

@router.delete("/appropriations/{appropriation_id}")
def delete_appropriation(appropriation_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete appropriation flow and lets the service decide whether it should be deleted or deactivated
    """
    return finance_service.delete_appropriation(db, appropriation_id)


# ── AppropriationFundSource ────────────────────────────────────────────────
@router.post("/appropriation-fund-sources", response_model=AppropriationFundSourceResponse, status_code=201)
def create_appr_fund_source(data: AppropriationFundSourceCreate, db: Session = Depends(get_db), current_user: UserAccount = Depends(get_current_user)):
    """
    This route creates the create appr fund source flow and passes the request into the service layer
    It expects appropriation_id as UUID, fund_source_id as UUID, expense_class as ExpenseClass, and appropriated_amount as Decimal
    """
    return finance_service.create_appr_fund_source(db, data, current_user)

@router.get("/appropriation-fund-sources", response_model=List[AppropriationFundSourceResponse])
def list_appr_fund_sources(
    appropriation_id: UUID = Query(..., description="Parent appropriation UUID"),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list appr fund sources data the caller asked for
    """
    return finance_service.get_appr_fund_sources(db, appropriation_id)

@router.get("/appropriation-fund-sources/{appr_fund_source_id}", response_model=AppropriationFundSourceResponse)
def get_appr_fund_source(appr_fund_source_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get appr fund source data the caller asked for
    """
    return AppropriationFundSourceResponse.model_validate(finance_service.get_appr_fund_source(db, appr_fund_source_id))

@router.put("/appropriation-fund-sources/{appr_fund_source_id}", response_model=AppropriationFundSourceResponse)
def update_appr_fund_source(appr_fund_source_id: UUID, data: AppropriationFundSourceUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update appr fund source flow and passes the request into the service layer
    It can also receive appropriated_amount as Optional[Decimal]
    """
    return finance_service.update_appr_fund_source(db, appr_fund_source_id, data)

@router.delete("/appropriation-fund-sources/{appr_fund_source_id}")
def delete_appr_fund_source(appr_fund_source_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete appr fund source flow and lets the service decide whether it should be deleted or deactivated
    """
    return finance_service.delete_appr_fund_source(db, appr_fund_source_id)


# ── Financial Summary ──────────────────────────────────────────────────────
@router.get("/projects/{project_id}/summary", response_model=ProjectFinancialSummary)
def project_financial_summary(
    project_id: UUID,
    fiscal_year: Optional[int] = Query(None, description="Filter by project AIP fiscal year"),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the project financial summary data the caller asked for
    """
    return finance_service.get_project_financial_summary(db, project_id, fiscal_year=fiscal_year)


@router.get("/projects/{project_id}/ledger", response_model=ProjectFinancialLedger)
def project_financial_ledger(
    project_id: UUID,
    fiscal_year: Optional[int] = Query(None, description="Filter by project AIP fiscal year"),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the project financial ledger data the caller asked for
    """
    return finance_service.get_project_financial_ledger(db, project_id, fiscal_year=fiscal_year)