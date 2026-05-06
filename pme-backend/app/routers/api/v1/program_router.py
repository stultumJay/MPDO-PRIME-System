from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse
from app.services import program_service

router = APIRouter(prefix="/programs", tags=["Programs"])


@router.post("/", response_model=ProgramResponse, status_code=201)
def create_program(
    data: ProgramCreate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route creates the create program flow and passes the request into the service layer
    It expects sector_id as UUID, program_name as str, and description as Optional[str]
    It can also receive is_active as bool
    """
    return program_service.create_program(db, data)


@router.get("/", response_model=List[ProgramResponse])
def list_programs(
    sector_id: Optional[UUID] = Query(None, description="Filter by sector UUID"),
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the list programs data the caller asked for
    """
    return program_service.get_programs(db, sector_id=sector_id)


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(
    program_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the get program data the caller asked for
    """
    return ProgramResponse.model_validate(program_service.get_program(db, program_id))


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: UUID,
    data: ProgramUpdate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route updates the update program flow and passes the request into the service layer
    It expects program_name as Optional[str], description as Optional[str], and is_active as Optional[bool]
    """
    return program_service.update_program(db, program_id, data)


@router.delete("/{program_id}")
def delete_program(
    program_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route removes the delete program flow and lets the service decide whether it should be deleted or deactivated
    """
    return program_service.delete_program(db, program_id)