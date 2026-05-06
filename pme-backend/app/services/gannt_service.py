from sqlalchemy.orm import Session, joinedload
from app.models.project import Project
from app.models.project_aip import ProjectAIP
from datetime import date, datetime


def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_date(value, fallback):
    if isinstance(value, (date, datetime)):
        return value
    return fallback


def performance_progress(performance) -> int:
    if not performance:
        return 0

    target_total = safe_int(getattr(performance, "target_total", 0))
    if target_total <= 0:
        return 0

    total_actual = (
        safe_int(getattr(performance, "actual_q1", 0))
        + safe_int(getattr(performance, "actual_q2", 0))
        + safe_int(getattr(performance, "actual_q3", 0))
        + safe_int(getattr(performance, "actual_q4", 0))
    )

    progress = (total_actual / target_total) * 100
    return max(0, min(100, round(progress)))


def get_gantt_data(db: Session, fiscal_year: int = None):
    if not fiscal_year:
        fiscal_year = datetime.now().year

    aip_rows = (
        db.query(ProjectAIP)
        .options(
            joinedload(ProjectAIP.project).joinedload(Project.sector),
            joinedload(ProjectAIP.performance),
        )
        .join(Project, Project.project_id == ProjectAIP.project_id)
        .filter(
            ProjectAIP.fiscal_year == fiscal_year,
            ProjectAIP.is_active.is_(True),
            Project.is_active.is_(True),
        )
        .all()
    )

    all_sectors = sorted({
        aip.project.sector.sector_name
        for aip in aip_rows
        if aip.project and aip.project.sector and aip.project.sector.sector_name
    })
    all_years = db.query(ProjectAIP.fiscal_year).distinct().all()
    years_list = sorted(
        [str(y[0]) for y in all_years if y[0]],
        reverse=True,
    )

    project_list = []
    for aip in aip_rows:
        p = aip.project
        if not p:
            continue

        start_date = safe_date(
            p.actual_start_date or p.expected_start_date,
            datetime(fiscal_year, 1, 1),
        )

        end_date = safe_date(
            p.actual_end_date or p.expected_end_date,
            datetime(fiscal_year, 12, 31),
        )

        start_month = start_date.month

        duration = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month + 1
        duration = max(1, min(duration, 13 - start_month))

        progress = performance_progress(aip.performance)

        if progress < 30:
            status = "Major Delay"
        elif progress < 70:
            status = "Slight Delay"
        else:
            status = "On Schedule"

        project_list.append({
            "name": p.project_title or "Untitled Project",
            "sector": p.sector.sector_name if p.sector else "Unassigned",
            "status": status,
            "startMonth": start_month,
            "duration": duration,
            "progress": progress,
            "plannedProgress": 100,
            "performanceGap": 0,
        })

    return {
        "fiscalYear": fiscal_year,
        "years": years_list or [str(fiscal_year)],
        "sectors": ["All Sectors"] + all_sectors,
        "projects": project_list,
    }