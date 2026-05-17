from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount
from app.schemas.sector import SectorCreate, SectorUpdate, SectorResponse
from app.services import sector_service

router = APIRouter(prefix="/sectors", tags=["Sectors"])


@router.post("/", response_model=SectorResponse, status_code=201)
def create_sector(
    data: SectorCreate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route creates the create sector flow and passes the request into the service layer
    It expects sector_code as str and sector_name as str
    """
    return sector_service.create_sector(db, data)


@router.get("/", response_model=List[SectorResponse])
def list_sectors(
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the list sectors data the caller asked for
    """
    return sector_service.get_sectors(db)


@router.get("/{sector_id}", response_model=SectorResponse)
def get_sector(
    sector_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the get sector data the caller asked for
    """
    sector = sector_service.get_sector(db, sector_id)
    resp = SectorResponse.model_validate(sector)
    return resp


@router.put("/{sector_id}", response_model=SectorResponse)
def update_sector(
    sector_id: UUID,
    data: SectorUpdate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route updates the update sector flow and passes the request into the service layer
    It can also receive sector_code as Optional[str] and sector_name as Optional[str]
    """
    return sector_service.update_sector(db, sector_id, data)


@router.delete("/{sector_id}")
def delete_sector(
    sector_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route removes the delete sector flow and lets the service decide whether it should be deleted or deactivated
    """
    return sector_service.delete_sector(db, sector_id)