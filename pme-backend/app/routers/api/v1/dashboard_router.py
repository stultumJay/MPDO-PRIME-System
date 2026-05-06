from typing import Optional
 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
 
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import UserAccount
 
from app.services.analytics_service import (
    get_dashboard_metrics,
    get_sector_impact
    )

from app.services.report_service import (
    get_budget_utilization,
    )

from app.services.audit_service import get_recent_activities
 
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
 
 
@router.get("/summary")
def summary(
    fiscal_year: Optional[int] = Query(None, description="Filter by fiscal year"),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the summary data the caller asked for
    """
    return get_dashboard_metrics(db, fiscal_year)
 

@router.get("/allocation-vs-disbursement")
def allocation_vs_disbursement(
    months: int = Query(6, ge=1, le=36),
    fiscal_year: int | None = Query(None, ge=2000, le=2100),
    anchor_year: int | None = Query(None, ge=2000, le=2100),
    anchor_month: int | None = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the allocation vs disbursement data the caller asked for
    """
    return get_budget_utilization(
        db,
        fiscal_year=fiscal_year,
        months=months,
        anchor_year=anchor_year,
        anchor_month=anchor_month,
    )

 
@router.get("/institutional-pulse")
def institutional_pulse(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the institutional pulse data the caller asked for
    """
    return get_recent_activities(db, limit=limit)
 
 
@router.get("/sector-impact")
def sector_impact(
    fiscal_year: Optional[int] = Query(None, description="Filter by fiscal year"),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the sector impact data the caller asked for
    """
    return get_sector_impact(db, fiscal_year)