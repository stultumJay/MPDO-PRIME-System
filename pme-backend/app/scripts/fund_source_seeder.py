import uuid
from app.db.session import SessionLocal
from app.models import FundSource


def seed_fund_sources():
    db = SessionLocal()

    try:
        existing = db.query(FundSource).first()
        if existing:
            print("Fund sources already exist. Skipping.")
            return

        sources = [
            {
                "fund_category": "National",
                "fund_name": "NATIONAL GOVERNMENT FUND",
                "description": "National government funding"
            },
            {
                "fund_category": "Donor",
                "fund_name": "DONOR FUND",
                "description": "Externally funded projects"
            },
            {
                "fund_category": "PPP",
                "fund_name": "PUBLIC-PRIVATE PARTNERSHIP FUND",
                "description": "Public-Private Partnership"
            },
            {
                "fund_category": "Regional",
                "fund_name": "REGIONAL FUND",
                "description": "Regional funding"
            },

            {
                "fund_category": "LGU",
                "fund_name": "GENERAL FUND 20%",
                "description": "20% Development Fund"
            },
            {
                "fund_category": "LGU",
                "fund_name": "EXTERNAL SOURCE",
                "description": "Externally sourced LGU funds"
            },
            {
                "fund_category": "LGU",
                "fund_name": "5% LDRRMF",
                "description": "Disaster Risk Reduction Fund"
            },
            {
                "fund_category": "LGU",
                "fund_name": "EXCISE TAX",
                "description": "Excise tax allocation"
            },
            {
                "fund_category": "LGU",
                "fund_name": "LEE Fund",
                "description": "Local Economic Enterprise fund"
            },
            {
                "fund_category": "LGU",
                "fund_name": "MDF",
                "description": "Municipal Development Fund"
            },
        ]

        for s in sources:
            db.add(FundSource(
                fund_source_id=uuid.uuid4(),
                fund_category=s["fund_category"],
                fund_name=s["fund_name"],
                description=s["description"],
                is_active=True
            ))

        db.commit()
        print("Fund sources seeded")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_fund_sources()
