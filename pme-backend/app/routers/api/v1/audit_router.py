from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.audit_service import (
    get_recent_activities,
)

router = APIRouter(prefix="/audit", tags=["Audit"])


# ─────────────────────────────────────────────
# INSTITUTIONAL PULSE
# ─────────────────────────────────────────────
@router.get("/activities")
def recent_activities(
    limit: int = 5,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """
    This route returns the recent activities data the caller asked for
    """
    return get_recent_activities(db, limit, start_date, end_date)
