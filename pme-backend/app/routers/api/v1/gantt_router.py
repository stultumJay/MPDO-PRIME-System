from typing import Optional
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.gannt_service import get_gantt_data

router = APIRouter(prefix="/gantt", tags=["Gantt"])


@router.get("/")
def read_gantt(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        return get_gantt_data(db, year)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))