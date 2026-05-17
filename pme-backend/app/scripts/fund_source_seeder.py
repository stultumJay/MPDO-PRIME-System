import uuid
from app.db.session import SessionLocal
from app.models import FundSource
from app.scripts.utils import get_or_create


def run():
    db = SessionLocal()

    try:
        sources = [
            ("National", "NATIONAL GOVERNMENT FUND", "National government funding"),
            ("Donor", "DONOR FUND", "Externally funded projects"),
            ("PPP", "PUBLIC-PRIVATE PARTNERSHIP FUND", "Public-Private Partnership"),
            ("Regional", "REGIONAL FUND", "Regional funding"),
            ("LGU", "GENERAL FUND 20%", "20% Development Fund"),
            ("LGU", "EXTERNAL SOURCE", "Externally sourced LGU funds"),
            ("LGU", "5% LDRRMF", "Disaster Risk Reduction Fund"),
            ("LGU", "EXCISE TAX", "Excise tax allocation"),
            ("LGU", "LEE Fund", "Local Economic Enterprise fund"),
            ("LGU", "MDF", "Municipal Development Fund"),
        ]

        for category, name, desc in sources:
            get_or_create(
                db,
                FundSource,
                filters={"fund_name": name},
                defaults={
                    "fund_source_id": uuid.uuid4(),
                    "fund_category": category,
                    "description": desc,
                    "is_active": True
                }
            )

        db.commit()
        print("Fund sources seeded safely")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)

    finally:
        db.close()


if __name__ == "__main__":
    run()