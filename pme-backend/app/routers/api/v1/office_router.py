from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount
from app.schemas.office import OfficeCreate, OfficeUpdate, OfficeResponse
from app.services import office_service

router = APIRouter(prefix="/offices", tags=["Offices"])


@router.post("/", response_model=OfficeResponse, status_code=201)
def create_office(
    data: OfficeCreate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route creates the create office flow and passes the request into the service layer
    It expects office_code as str, office_type as int, and office_name as str
    It can also receive mandate as Optional[str], vision as Optional[str], mission as Optional[str], and organizational_outcome as Optional[str]
    """
    return office_service.create_office(db, data)


@router.get("/", response_model=List[OfficeResponse])
def list_offices(
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the list offices data the caller asked for
    """
    return office_service.get_offices(db)


@router.get("/{office_id}", response_model=OfficeResponse)
def get_office(
    office_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the get office data the caller asked for
    """
    return OfficeResponse.model_validate(office_service.get_office(db, office_id))


@router.get("/{office_id}/lbp-header")
def get_lbp_header(
    office_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route returns the get lbp header data the caller asked for
    """
    office = office_service.get_office(db, office_id)
    return {
        "office_id":              office.office_id,
        "office_name":            office.office_name,
        "mandate":                office.mandate,
        "vision":                 office.vision,
        "mission":                office.mission,
        "organizational_outcome": office.organizational_outcome,
    }

@router.put("/{office_id}", response_model=OfficeResponse)
def update_office(
    office_id: UUID,
    data: OfficeUpdate,
    db:   Session     = Depends(get_db),
    _:    UserAccount = Depends(get_current_user),
):
    """
    This route updates the update office flow and passes the request into the service layer
    It can also receive office_name as Optional[str], mandate as Optional[str], vision as Optional[str], mission as Optional[str], and organizational_outcome as Optional[str]
    """
    return office_service.update_office(db, office_id, data)


@router.delete("/{office_id}")
def delete_office(
    office_id: UUID,
    db: Session     = Depends(get_db),
    _:  UserAccount = Depends(get_current_user),
):
    """
    This route removes the delete office flow and lets the service decide whether it should be deleted or deactivated
    """
    return office_service.delete_office(db, office_id)