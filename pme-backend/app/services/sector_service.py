from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from uuid import UUID

from app.models.sector import Sector
from app.schemas.sector import SectorCreate, SectorUpdate, SectorResponse


def create_sector(db: Session, data: SectorCreate) -> SectorResponse:
    """
    This creates the sector record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    if db.query(Sector).filter(Sector.sector_code == data.sector_code).first():
        raise HTTPException(400, f"Sector code '{data.sector_code}' already exists.")
    sector = Sector(**data.model_dump())
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return SectorResponse.model_validate(sector)


def get_sectors(db: Session) -> List[SectorResponse]:
    """
    This gets the sectors data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    sectors = db.query(Sector).order_by(Sector.sector_name).all()
    return [SectorResponse.model_validate(s) for s in sectors]


def get_sector(db: Session, sector_id: UUID) -> Sector:
    """
    This gets the sector data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    sector = db.query(Sector).filter(Sector.sector_id == sector_id).first()
    if not sector:
        raise HTTPException(404, "Sector not found.")
    return sector


def update_sector(db: Session, sector_id: UUID, data: SectorUpdate) -> SectorResponse:
    """
    This updates the sector record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    sector = get_sector(db, sector_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sector, field, value)
    db.commit()
    db.refresh(sector)
    return SectorResponse.model_validate(sector)


def delete_sector(db: Session, sector_id: UUID) -> dict:
    """
    This removes or deactivates the sector record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    sector = get_sector(db, sector_id)
    db.delete(sector)
    db.commit()
    return {"detail": f"Sector '{sector.sector_name}' deleted."}