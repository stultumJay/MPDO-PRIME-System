from typing import List
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.phase_config import PhaseConfig


def get_gantt_data(db: Session):
    """
    This gets the gantt data data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    projects = db.query(Project).all()
    phases = db.query(PhaseConfig).all()

    result = []

    for p in projects:
        phase_data = []
        for ph in phases:
            phase_data.append({
                "phase": ph.phase_name,
                "start": p.expected_start_date,
                "end": p.expected_end_date
            })

        result.append({
            "project": p.project_title,
            "timeline": phase_data
        })

    return result