from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.disbursement import DisbursementCreate, DisbursementUpdate, DisbursementResponse
from app.services import disbursement_service

router = APIRouter(prefix="/disbursements", tags=["Disbursements"])


@router.post("/", response_model=DisbursementResponse, status_code=201)
def create_disbursement(data: DisbursementCreate, db: Session = Depends(get_db), current_user: UserAccount = Depends(get_current_user)):
    """
    This route creates the create disbursement flow and passes the request into the service layer
    It expects obligation_id as UUID, payment_method as str, disbursement_amount as Decimal, and disbursement_date as date
    It can also receive reference_number as Optional[str] and remarks as Optional[str]
    """
    return disbursement_service.create_disbursement(db, data, current_user)


@router.get("/", response_model=List[DisbursementResponse])
def list_disbursements(
    obligation_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list disbursements data the caller asked for
    """
    return disbursement_service.get_disbursements(db, obligation_id=obligation_id)


@router.get("/{disbursement_id}", response_model=DisbursementResponse)
def get_disbursement(disbursement_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get disbursement data the caller asked for
    """
    return disbursement_service.get_disbursement(db, disbursement_id)


@router.put("/{disbursement_id}", response_model=DisbursementResponse)
def update_disbursement(disbursement_id: UUID, data: DisbursementUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update disbursement flow and passes the request into the service layer
    It can also receive payment_method as Optional[str], reference_number as Optional[str], disbursement_amount as Optional[Decimal], disbursement_date as Optional[date], and remarks as Optional[str]
    """
    return disbursement_service.update_disbursement(db, disbursement_id, data)


@router.delete("/{disbursement_id}")
def delete_disbursement(disbursement_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete disbursement flow and lets the service decide whether it should be deleted or deactivated
    """
    return disbursement_service.delete_disbursement(db, disbursement_id)