import uuid
from decimal import Decimal
from app.db.session import SessionLocal
from app.models.office import Office
from app.models.sector import Sector
from app.models.phase_config import PhaseConfig
from app.scripts.utils import get_or_create


def run():
    db = SessionLocal()

    try:
        # Sectors
        sectors = [
            ("8000", "Infrastructure"),
            ("3000", "Social"),
            ("8000", "Economic"),
            ("1000", "Environmental"),
            ("1000", "Institutional"),
            ("9000", "Others"),
        ]

        for code, name in sectors:
            get_or_create(
                db,
                Sector,
                {"sector_name": name},
                {
                    "sector_id": uuid.uuid4(),
                    "sector_code": code
                }
            )

        db.commit()

        # Offices
        def create_office(code, otype, name):
            return {
                "office_code": code,
                "office_type": otype,
                "office_name": name,
                "mandate": f"Mandate of {name}",
                "vision": f"Vision of {name}",
                "mission": f"Mission of {name}",
                "organizational_outcome": f"Outcome of {name}",
            }

        offices = [
            create_office("01", 1, "Office of the Municipal Mayor"),
            create_office("09", 1, "Office of the Municipal Planning and Development Coordinator"),
            create_office("01", 2, "Office of the Municipal Administrator"),
        ]

        for o in offices:
            get_or_create(
                db,
                Office,
                {"office_name": o["office_name"]},
                {"office_id": uuid.uuid4(), **o}
            )

        db.commit()

        # Phases
        phases = [
            ("Prelim", Decimal("10.00")),
            ("Procurement", Decimal("20.00")),
            ("Construction", Decimal("60.00")),
            ("Testing", Decimal("10.00")),
        ]

        for name, weight in phases:
            get_or_create(
                db,
                PhaseConfig,
                {"phase_name": name},
                {
                    "phase_id": uuid.uuid4(),
                    "weight_percent": weight
                }
            )

        db.commit()
        print("Sectors, Offices, Phases seeded safely")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)

    finally:
        db.close()


if __name__ == "__main__":
    run()