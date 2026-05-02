from app.scripts.fund_source_seeder import run as fund_seed
from app.scripts.login_seeder import run as login_seed
from app.scripts.sectors_office_phase_seeder import run as sector_seed


def run_all():
    print("Seeding started...")

    sector_seed()
    fund_seed()
    login_seed()

    print("Seeding completed safely.")


if __name__ == "__main__":
    run_all()