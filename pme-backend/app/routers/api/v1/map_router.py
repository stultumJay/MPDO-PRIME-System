from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount
from app.services.map_service import get_project_locations

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("/")
def project_map(
    fiscal_year: Optional[int]  = Query(None),
    barangay:    Optional[str]  = Query(None),
    sector_id:   Optional[str]  = Query(None),
    status:      Optional[str]  = Query(None),
    db:          Session        = Depends(get_db),
    _:           UserAccount    = Depends(get_current_user),
):
    """
    This route returns the project map data the caller asked for
    """
    return get_project_locations(
        db,
        barangay=barangay,
        sector_id=sector_id,
        status=status,
        fiscal_year=fiscal_year,
    )