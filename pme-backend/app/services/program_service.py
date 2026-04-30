from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional
from uuid import UUID

from app.models.program import Program
from app.models.sector import Sector
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse


def _next_program_code(db: Session, sector_id: UUID) -> str:
    """
    Count ALL programs for this sector (including deactivated)
    and return the next 3-digit code, ensuring uniqueness.
    """
    count = db.query(Program).filter(Program.sector_id == sector_id).count()
    return f"{count + 1:03d}"


def create_program(db: Session, data: ProgramCreate) -> ProgramResponse:
    # FIX: use sector_id (UUID FK) not sector_code; Sector has no is_active
    """
    This creates the program record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    sector = db.query(Sector).filter(Sector.sector_id == data.sector_id).first()
    if not sector:
        raise HTTPException(404, "Sector not found.")

    # Check for duplicate program_name within same sector
    if db.query(Program).filter(
        Program.sector_id    == data.sector_id,
        Program.program_name == data.program_name,
        Program.is_active.is_(True),
    ).first():
        raise HTTPException(400, f"Program '{data.program_name}' already exists in this sector.")

    program_code = _next_program_code(db, data.sector_id)

    program = Program(
        sector_id    = data.sector_id,
        program_code = program_code,
        program_name = data.program_name,
        description  = data.description,
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return ProgramResponse.model_validate(program)


def get_programs(
    db:        Session,
    sector_id: Optional[UUID] = None,
) -> List[ProgramResponse]:
    """
    This gets the programs data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Program).filter(Program.is_active.is_(True))
    if sector_id:
        q = q.filter(Program.sector_id == sector_id)
    programs = q.order_by(Program.sector_id, Program.program_code).all()
    return [ProgramResponse.model_validate(p) for p in programs]


def get_program(db: Session, program_id: UUID) -> Program:
    """
    This gets the program data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    program = db.query(Program).filter(
        Program.program_id == program_id,
        Program.is_active.is_(True),
    ).first()
    if not program:
        raise HTTPException(404, "Program not found.")
    return program


def update_program(db: Session, program_id: UUID, data: ProgramUpdate) -> ProgramResponse:
    """
    This updates the program record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    program = get_program(db, program_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(program, field, value)
    db.commit()
    db.refresh(program)
    return ProgramResponse.model_validate(program)


def delete_program(db: Session, program_id: UUID) -> dict:
    """
    This removes or deactivates the program record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    program = get_program(db, program_id)
    program.is_active = False
    db.commit()
    return {"detail": f"Program '{program.program_code} – {program.program_name}' deactivated."}