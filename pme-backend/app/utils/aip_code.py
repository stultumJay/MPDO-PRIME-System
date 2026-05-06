from __future__ import annotations

from sqlalchemy.orm import Session
from fastapi import HTTPException

_LGU = "3"  # Alubijid is a municipality, so the LGU segment is always 3


# PROJECT SEQUENCE, GLOBAL PER YEAR
# Pseudo-code guide
# Find the project sequence row for the fiscal year
# If no row exists yet, create one starting at zero
# Lock the row while increasing it so two users cannot receive the same number
# Return the next number and let format_project_code turn it into PRJ-YYYY-NNN
def next_project_seq(db: Session, fiscal_year: int) -> int:
    """
    This gets the next project seq value from the sequence logic
    It makes sure the backend can keep numbering in a steady and predictable order
    """
    from app.models.sequence import ProjectSequence

    # This query finds the one counter row for the year and locks it until the transaction ends
    row = (
        db.query(ProjectSequence)
        .filter(ProjectSequence.fiscal_year == fiscal_year)
        .with_for_update()
        .first()
    )

    # If this is the first project for the year, create the counter row before adding 1
    if not row:
        row = ProjectSequence(fiscal_year=fiscal_year, last_value=0)
        db.add(row)
        db.flush()

    # The stored value always means the last number already issued
    row.last_value += 1
    db.flush()
    return row.last_value


def format_project_code(fiscal_year: int, seq: int) -> str:
    """
    This formats the value used by the rest of the backend
    It puts together the final text in the format the system expects
    """
    return f"PRJ-{fiscal_year}-{seq:03d}"


# AIP SEQUENCE, PER PROGRAM PER YEAR
# Pseudo-code guide
# The last AIP segment is the project number inside one program for one fiscal year
# Look for the counter row that belongs to the fiscal year and the program
# The database column is still named sector_id because the old table already exists
# From this point on, this helper stores the program_id in that UUID bucket
# If the counter row does not exist, count existing AIP rows under the same program first
# Add one and return it, so the first project in every program becomes 001
def next_aip_seq(db: Session, fiscal_year: int, program_id) -> int:
    """
    This gets the next aip seq value from the sequence logic
    It makes sure the backend can keep numbering in a steady and predictable order
    """
    from app.models.sequence import AipSequence
    from app.models import ProjectAIP
    from app.models.project import Project

    # The old model field is called sector_id, but the new numbering rule uses program_id here
    row = (
        db.query(AipSequence)
        .filter(
            AipSequence.fiscal_year == fiscal_year,
            AipSequence.sector_id == program_id,
        )
        .with_for_update()
        .first()
    )

    # If a sequence row is missing, rebuild the starting value from existing AIP entries
    if not row:
        existing_count = (
            db.query(ProjectAIP)
            .join(Project, ProjectAIP.project_id == Project.project_id)
            .filter(
                Project.program_id == program_id,
                ProjectAIP.fiscal_year == fiscal_year,
            )
            .count()
        )

        row = AipSequence(
            fiscal_year=fiscal_year,
            sector_id=program_id,
            last_value=existing_count,
        )
        db.add(row)
        db.flush()

    # Increasing this value creates the NNN part of the AIP code
    row.last_value += 1
    db.flush()

    return row.last_value


# AIP REFERENCE CODE BUILDER
# Pseudo-code guide
# Load the project first because it connects all needed parts together
# Make sure the project has a program, office, and sector before building the code
# Use the sector code for SSSS, because sectors still own the program group
# Use the office type and office code from the implementing office
# Use the program code for PPP, because programs are standardized under a sector
# Use the program-based sequence for NNN, so every program starts its projects at 001
def build_aip_reference_code(
    db: Session,
    project_id,
    fiscal_year: int,
) -> str:
    """
    Format:   SSSS - L - T - CC - PPP - NNN
    SSSS  4-digit sector_code from sector table
    L     LGU level, always 3 for municipality
    T     office.office_type, either 1 or 2
    CC    office.office_code, 2-character string like 01
    PPP   program.program_code zero-padded to 3 digits
    NNN   project sequence per program per fiscal year

    Example:
        3000-3-1-01-001-001
    """
    from app.models.project import Project
    from app.models.program import Program
    from app.models.office import Office
    from app.models.sector import Sector

    # The project is the center record, because it points to the program, office, and sector
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found while generating AIP code.")

    # A project cannot receive an AIP code until it belongs to one standardized program
    if not project.program_id:
        raise HTTPException(422, f"Project '{project.project_code}' has no program assigned.")

    program = db.query(Program).filter(Program.program_id == project.program_id).first()
    if not program:
        raise HTTPException(422, "Program not found.")

    if not project.office_id:
        raise HTTPException(422, f"Project '{project.project_code}' has no implementing office.")

    office = db.query(Office).filter(Office.office_id == project.office_id).first()
    if not office:
        raise HTTPException(422, "Office not found.")

    if not project.sector_id:
        raise HTTPException(422, f"Project '{project.project_code}' has no sector assigned.")

    sector = db.query(Sector).filter(Sector.sector_id == project.sector_id).first()
    if not sector:
        raise HTTPException(422, "Sector not found.")

    # These four lines prepare the fixed visible parts of the code
    sector_code = str(sector.sector_code)
    office_type = str(office.office_type)
    office_code = str(office.office_code).zfill(2)
    program_seg = str(program.program_code).zfill(3)

    # The final segment now resets per program, so program_id is the counter bucket
    seq = next_aip_seq(db, fiscal_year, project.program_id)

    return f"{sector_code}-{_LGU}-{office_type}-{office_code}-{program_seg}-{seq:03d}"