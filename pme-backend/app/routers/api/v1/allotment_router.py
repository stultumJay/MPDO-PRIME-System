from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.allotment import AllotmentCreate, AllotmentUpdate, AllotmentResponse
from app.services import allotment_service

router = APIRouter(prefix="/allotments", tags=["Allotments"])


@router.post("/", response_model=AllotmentResponse, status_code=201)
def create_allotment(data: AllotmentCreate, db: Session = Depends(get_db), current_user: UserAccount = Depends(get_current_user)):
    """
    This route creates the create allotment flow and passes the request into the service layer
    It expects appr_fund_source_id as UUID, aro_number as str, amount_released as Decimal, and release_date as date
    It can also receive remarks as Optional[str]
    """
    return allotment_service.create_allotment(db, data, current_user)


@router.get("/", response_model=List[AllotmentResponse])
def list_allotments(
    appr_fund_source_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list allotments data the caller asked for
    """
    return allotment_service.get_allotments(db, appr_fund_source_id=appr_fund_source_id)


@router.get("/{allotment_id}", response_model=AllotmentResponse)
def get_allotment(allotment_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get allotment data the caller asked for
    """
    return allotment_service.get_allotment(db, allotment_id)


@router.put("/{allotment_id}", response_model=AllotmentResponse)
def update_allotment(allotment_id: UUID, data: AllotmentUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update allotment flow and passes the request into the service layer
    It can also receive aro_number as Optional[str], amount_released as Optional[Decimal], release_date as Optional[date], and remarks as Optional[str]
    """
    return allotment_service.update_allotment(db, allotment_id, data)


@router.delete("/{allotment_id}")
def delete_allotment(allotment_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete allotment flow and lets the service decide whether it should be deleted or deactivated
    """
    return allotment_service.delete_allotment(db, allotment_id)