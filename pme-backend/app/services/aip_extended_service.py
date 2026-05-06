from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.office import Office
from app.models.program import Program
from app.schemas.aip import AIPResponse


def get_filtered_aip(
    db: Session,
    fiscal_year: Optional[int] = None,
    sector_id: Optional[UUID] = None,
    office_id: Optional[UUID] = None,
    search: Optional[str] = None,
):
    """
    This gets the filtered aip data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(ProjectAIP).join(Project)

    if fiscal_year:
        q = q.filter(ProjectAIP.fiscal_year == fiscal_year)

    if sector_id:
        q = q.filter(Project.sector_id == sector_id)

    if office_id:
        q = q.filter(Project.office_id == office_id)

    if search:
        q = q.filter(
            Project.project_title.ilike(f"%{search}%") |
            ProjectAIP.aip_reference_code.ilike(f"%{search}%")
        )

    results = q.all()

    return [AIPResponse.model_validate(r) for r in results]