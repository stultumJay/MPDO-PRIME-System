from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import UserAccount

from app.services.report_service import (
    generate_lbp_form_4,
    generate_quarterly_physical_report,
    generate_physical_financial_report,
)

router = APIRouter(prefix="/forms", tags=["Forms / Reports"])

# ─────────────────────────────────────────────
# LBP FORM NO. 4
# Mandate, Vision, MFO, Performance, Budget
# ─────────────────────────────────────────────
@router.get("/lbp-form-4")
def lbp_form_4(
    office_id: UUID,
    fiscal_year: int,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the lbp form 4 data the caller asked for
    """
    return generate_lbp_form_4(db, office_id, fiscal_year)


# ─────────────────────────────────────────────
# LBAc FORM NO. 3 (QUARTERLY)
# Physical Report of Operations
# ─────────────────────────────────────────────
@router.get("/quarterly-physical")
def quarterly_physical(
    office_id: UUID,
    fiscal_year: int,
    quarter: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the quarterly physical data the caller asked for
    """
    return generate_quarterly_physical_report(db, office_id, fiscal_year, quarter)


# ─────────────────────────────────────────────
# LBAc FORM NO. 5
# Physical and Financial Performance
# ─────────────────────────────────────────────
@router.get("/physical-financial")
def physical_financial(
    office_id: UUID,
    fiscal_year: int,
    semester: int = Query(..., ge=1, le=2),
    db: Session = Depends(get_db),
    _: UserAccount = Depends(get_current_user),
):
    """
    This route returns the physical financial data the caller asked for
    """
    return generate_physical_financial_report(db, office_id, fiscal_year, semester)