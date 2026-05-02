import uuid
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import UserAccount
from app.core.security import hash_password
from app.scripts.utils import get_or_create


def run():
    db = SessionLocal()

    try:
        # Roles
        admin_role, _ = get_or_create(
            db,
            Role,
            {"role_name": "ADMIN"},
            {"role_id": uuid.uuid4()}
        )

        staff_role, _ = get_or_create(
            db,
            Role,
            {"role_name": "STAFF"},
            {"role_id": uuid.uuid4()}
        )

        db.commit()

        # Users
        get_or_create(
            db,
            UserAccount,
            {"username": "admin"},
            {
                "full_name": "System Admin",
                "email": "admin@example.com",
                "password_hash": hash_password("admin123"),
                "role_id": admin_role.role_id,
                "is_active": True
            }
        )

        get_or_create(
            db,
            UserAccount,
            {"username": "gerfel"},
            {
                "full_name": "Staff User",
                "email": "staff@example.com",
                "password_hash": hash_password("staff123"),
                "role_id": staff_role.role_id,
                "is_active": True
            }
        )

        db.commit()
        print("Users + roles seeded safely")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)

    finally:
        db.close()


if __name__ == "__main__":
    run()