from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.obligation import ObligationCreate, ObligationUpdate, ObligationResponse
from app.services import obligation_service

router = APIRouter(prefix="/obligations", tags=["Obligations"])


@router.post("/", response_model=ObligationResponse, status_code=201)
def create_obligation(data: ObligationCreate, db: Session = Depends(get_db), current_user: UserAccount = Depends(get_current_user)):
    """
    This route creates the create obligation flow and passes the request into the service layer
    It expects allotment_id as UUID, payee as str, reference_document as str, obligation_amount as Decimal, and obligation_date as date
    It can also receive remarks as Optional[str]
    """
    return obligation_service.create_obligation(db, data, current_user)


@router.get("/", response_model=List[ObligationResponse])
def list_obligations(
    allotment_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list obligations data the caller asked for
    """
    return obligation_service.get_obligations(db, allotment_id=allotment_id)


@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(obligation_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get obligation data the caller asked for
    """
    return obligation_service.get_obligation(db, obligation_id)


@router.put("/{obligation_id}", response_model=ObligationResponse)
def update_obligation(obligation_id: UUID, data: ObligationUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update obligation flow and passes the request into the service layer
    It can also receive payee as Optional[str], reference_document as Optional[str], obligation_amount as Optional[Decimal], obligation_date as Optional[date], and remarks as Optional[str]
    """
    return obligation_service.update_obligation(db, obligation_id, data)


@router.delete("/{obligation_id}")
def delete_obligation(obligation_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete obligation flow and lets the service decide whether it should be deleted or deactivated
    """
    return obligation_service.delete_obligation(db, obligation_id)