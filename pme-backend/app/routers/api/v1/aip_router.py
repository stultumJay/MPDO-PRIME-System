from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
from app.schemas.aip import AIPCreate, AIPUpdate, AIPResponse
from app.services import aip_service

router = APIRouter(prefix="/aip", tags=["AIP"])


@router.post("/", response_model=AIPResponse, status_code=201)
def create_aip_entry(
    data: AIPCreate,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route creates the create aip entry flow and passes the request into the service layer
    It expects project_id as UUID, fiscal_year as int, major_final_output as str, performance_indicator as str, and target_total as int
    It can also receive proposed_budget_ps as Decimal, proposed_budget_mooe as Decimal, proposed_budget_fe as Decimal, proposed_budget_co as Decimal, target_q1 as int, target_q2 as int, target_q3 as int, target_q4 as int, and performance_remarks as Optional[str]
    """
    return aip_service.create_aip_entry(db, data)


@router.get("/", response_model=List[AIPResponse])
def list_aip(
    fiscal_year: Optional[int] = Query(None),
    office_id: Optional[UUID] = Query(None),
    sector_id: Optional[UUID] = Query(None, description="Filter by sector UUID"),
    q: Optional[str] = Query(None, description="Case-insensitive search on project title or AIP code"),
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the list aip data the caller asked for
    """
    return aip_service.get_aip_list(
        db,
        fiscal_year=fiscal_year,
        office_id=office_id,
        sector_id=sector_id,
        q=q,
        active_only=active_only,
        skip=(page - 1) * size,
        limit=size,
    )


# Static sub-routes must come before /{project_aip_id} because FastAPI resolves top-down
@router.get("/fiscal-years", response_model=List[int])
def fiscal_years(
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the fiscal years data the caller asked for
    """
    return aip_service.get_fiscal_years(db)


@router.get("/{project_aip_id}", response_model=AIPResponse)
def get_aip_entry(
    project_aip_id: UUID,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the get aip entry data the caller asked for
    """
    return aip_service.get_aip_entry(db, project_aip_id)


@router.put("/{project_aip_id}", response_model=AIPResponse)
def update_aip_entry(
    project_aip_id: UUID,
    data: AIPUpdate,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route updates the update aip entry flow and passes the request into the service layer
    It can also receive major_final_output as Optional[str], proposed_budget_ps as Optional[Decimal], proposed_budget_mooe as Optional[Decimal], proposed_budget_fe as Optional[Decimal], proposed_budget_co as Optional[Decimal], performance_indicator as Optional[str], target_total as Optional[int], target_q1 as Optional[int], target_q2 as Optional[int], target_q3 as Optional[int], target_q4 as Optional[int], actual_q1 as Optional[int], actual_q2 as Optional[int], actual_q3 as Optional[int], actual_q4 as Optional[int], and performance_remarks as Optional[str]
    """
    return aip_service.update_aip_entry(db, project_aip_id, data)


@router.delete("/{project_aip_id}")
def delete_aip_entry(
    project_aip_id: UUID,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route removes the delete aip entry flow and lets the service decide whether it should be deleted or deactivated
    """
    return aip_service.delete_aip_entry(db, project_aip_id)