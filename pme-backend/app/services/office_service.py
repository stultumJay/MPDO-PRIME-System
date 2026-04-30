from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from uuid import UUID

from app.models.office import Office
from app.schemas.office import OfficeCreate, OfficeUpdate, OfficeResponse


def create_office(db: Session, data: OfficeCreate) -> OfficeResponse:
    """
    This creates the office record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    if db.query(Office).filter(
        Office.office_type == data.office_type,
        Office.office_code == data.office_code,
    ).first():
        raise HTTPException(
            400,
            f"Office with type={data.office_type} and code='{data.office_code}' already exists.",
        )
    office = Office(**data.model_dump())
    db.add(office)
    db.commit()
    db.refresh(office)
    return OfficeResponse.model_validate(office)


def get_offices(db: Session) -> List[OfficeResponse]:
    """
    This gets the offices data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    offices = (
        db.query(Office)
        .order_by(Office.office_type, Office.office_code)
        .all()
    )
    return [OfficeResponse.model_validate(o) for o in offices]


def get_office(db: Session, office_id: UUID) -> Office:
    """
    This gets the office data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    office = db.query(Office).filter(
        Office.office_id == office_id
    ).first()
    if not office:
        raise HTTPException(404, "Office not found.")
    return office


def update_office(db: Session, office_id: UUID, data: OfficeUpdate) -> OfficeResponse:
    """
    This updates the office record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    office = get_office(db, office_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(office, field, value)
    db.commit()
    db.refresh(office)
    return OfficeResponse.model_validate(office)


def delete_office(db: Session, office_id: UUID) -> dict:
    """
    This removes or deactivates the office record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    office = get_office(db, office_id)
    db.delete(office)
    db.commit()
    return {"detail": f"Office '{office.office_name}' deleted."}