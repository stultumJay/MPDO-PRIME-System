from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.performance import PerformanceCreate, PerformanceUpdate, PerformanceResponse
from app.services import performance_service

router = APIRouter(prefix="/performances", tags=["Performance"])


@router.post("/", response_model=PerformanceResponse, status_code=201)
def create_performance(data: PerformanceCreate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route creates the create performance flow and passes the request into the service layer
    It expects performance_indicator as str and target_total as int
    It can also receive target_q1 as int, target_q2 as int, target_q3 as int, target_q4 as int, and remarks as Optional[str]
    """
    return performance_service.create_performance(db, data)


@router.get("/", response_model=List[PerformanceResponse])
def list_performances(db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the list performances data the caller asked for
    """
    return performance_service.get_performances(db)


@router.get("/{performance_id}", response_model=PerformanceResponse)
def get_performance(performance_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get performance data the caller asked for
    """
    return performance_service.get_performance(db, performance_id)


@router.put("/{performance_id}", response_model=PerformanceResponse)
def update_performance(performance_id: UUID, data: PerformanceUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update performance flow and passes the request into the service layer
    It can also receive performance_indicator as Optional[str], target_total as Optional[int], target_q1 as Optional[int], target_q2 as Optional[int], target_q3 as Optional[int], target_q4 as Optional[int], actual_q1 as Optional[int], actual_q2 as Optional[int], actual_q3 as Optional[int], actual_q4 as Optional[int], and remarks as Optional[str]
    """
    return performance_service.update_performance(db, performance_id, data)


@router.delete("/{performance_id}")
def delete_performance(performance_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete performance flow and lets the service decide whether it should be deleted or deactivated
    """
    return performance_service.delete_performance(db, performance_id)