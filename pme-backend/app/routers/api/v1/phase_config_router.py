from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.phase_config import (
    PhaseConfigCreate, PhaseConfigUpdate,
    PhaseConfigResponse, PhaseWeightSummary,
)
from app.services import phase_config_service

router = APIRouter(prefix="/phase-configs", tags=["Phase Configs"])


@router.post("/", response_model=PhaseConfigResponse, status_code=201)
def create_phase(data: PhaseConfigCreate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route creates the create phase flow and passes the request into the service layer
    It expects phase_name as str and weight_percent as Decimal
    """
    return phase_config_service.create_phase_config(db, data)


@router.get("/", response_model=List[PhaseConfigResponse])
def list_phases(db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the list phases data the caller asked for
    """
    return phase_config_service.get_phase_configs(db)


@router.get("/weight-summary", response_model=PhaseWeightSummary)
def weight_summary(db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the weight summary data the caller asked for
    """
    return phase_config_service.get_weight_summary(db)


@router.get("/{phase_id}", response_model=PhaseConfigResponse)
def get_phase(phase_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route returns the get phase data the caller asked for
    """
    return phase_config_service.get_phase_config(db, phase_id)


@router.put("/{phase_id}", response_model=PhaseConfigResponse)
def update_phase(phase_id: UUID, data: PhaseConfigUpdate, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route updates the update phase flow and passes the request into the service layer
    It can also receive phase_name as Optional[str] and weight_percent as Optional[Decimal]
    """
    return phase_config_service.update_phase_config(db, phase_id, data)


@router.delete("/{phase_id}")
def delete_phase(phase_id: UUID, db: Session = Depends(get_db), _: UserAccount = Depends(get_current_user)):
    """
    This route removes the delete phase flow and lets the service decide whether it should be deleted or deactivated
    """
    return phase_config_service.delete_phase_config(db, phase_id)