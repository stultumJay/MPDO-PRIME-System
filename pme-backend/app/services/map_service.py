from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.sector import Sector


def get_project_locations(
    db:          Session,
    barangay:    Optional[str]  = None,
    sector_id:   Optional[str]  = None,
    status:      Optional[str]  = None,
    fiscal_year: Optional[int]  = None,
) -> List[dict]:
    """
    This returns the projects that have real map coordinates and match the chosen filters
    It skips rows without latitude and longitude because those cannot be placed on the map
    """
    # The base query only keeps active projects that already have usable coordinates
    q = (
        db.query(Project, Sector.sector_name)
        .join(Sector, Sector.sector_id == Project.sector_id)
        .filter(
            Project.is_active.is_(True),
            Project.location_lat.isnot(None),
            Project.location_lng.isnot(None),
        )
    )

    if barangay:
        q = q.filter(Project.barangay.ilike(f"%{barangay}%"))
    if sector_id:
        q = q.filter(Project.sector_id == sector_id)
    if status:
        q = q.filter(Project.status == status)
    if fiscal_year:
        # This extra filter keeps only projects that appear in the requested AIP year
        aip_project_ids = (
            db.query(ProjectAIP.project_id)
            .filter(
                ProjectAIP.fiscal_year == fiscal_year,
                ProjectAIP.is_active.is_(True),
            )
            .subquery()
        )
        q = q.filter(Project.project_id.in_(aip_project_ids))

    rows = q.all()

    # The final list keeps just the fields the map view needs to render markers and labels
    return [
        {
            "project_id":   str(p.project_id),
            "project_code": p.project_code,
            "title":        p.project_title,
            "barangay":     p.barangay,
            "sector":       sector_name,
            "status":       p.status,
            "lat":          p.location_lat,
            "lng":          p.location_lng,
        }
        for p, sector_name in rows
    ]
