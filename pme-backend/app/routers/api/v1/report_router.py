from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount

from app.services.report_service import (
    get_project_summary_report,
    get_sector_summary_report,
    get_office_performance_report,
    # generate_lbp_form_4_grouped,
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/projects-summary")
def project_summary(
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the project summary data the caller asked for
    """
    return get_project_summary_report(db, fiscal_year)


@router.get("/sector-summary")
def sector_summary(
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the sector summary data the caller asked for
    """
    return get_sector_summary_report(db, fiscal_year)


@router.get("/office-performance")
def office_performance(
    office_id: UUID,
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the office performance data the caller asked for
    """
    return get_office_performance_report(db, office_id, fiscal_year)


# @router.get("/lbp-form-4")
# def lbp_form_4(
#     office_id:   UUID,
#     fiscal_year: int,
#     sector_id:   Optional[UUID] = Query(None, description="Optional sector filter"),
#     db:          Session     = Depends(get_db),
#     _:           UserAccount = Depends(get_current_user),
# ):
#     """LBP Form No. 4 grouped by sector → program → AIP rows."""
#     return generate_lbp_form_4_grouped(db, office_id, fiscal_year, sector_id)