from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount

from app.services.analytics_service import (
    get_dashboard_metrics,
    get_budget_utilization,
    get_project_status_distribution,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def dashboard(
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the dashboard data the caller asked for
    """
    return get_dashboard_metrics(db, fiscal_year)


@router.get("/budget-utilization")
def budget_utilization(
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the budget utilization data the caller asked for
    """
    return get_budget_utilization(db, fiscal_year)


@router.get("/project-status")
def project_status(
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the project status data the caller asked for
    """
    return get_project_status_distribution(db, fiscal_year)