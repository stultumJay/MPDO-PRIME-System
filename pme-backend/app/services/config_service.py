from sqlalchemy.orm import Session
from app.models.phase_config import PhaseConfig


def seed_default_phases(db: Session):
    """
    This seeds the default default phases data when the table is still empty
    It helps the app start with the records the rest of the backend expects to find
    """
    default_phases = [
        {"phase_name": "Prelim", "weight_percent": 10},
        {"phase_name": "Procurement", "weight_percent": 20},
        {"phase_name": "Construction", "weight_percent": 50},
        {"phase_name": "Testing", "weight_percent": 20},
    ]

    for p in default_phases:
        if not db.query(PhaseConfig).filter(
            PhaseConfig.phase_name == p["phase_name"]
        ).first():
            db.add(PhaseConfig(**p))

    db.commit()