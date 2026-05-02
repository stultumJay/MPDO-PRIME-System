from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import UserAccount
from app.core.security import hash_password
import uuid

db = SessionLocal()

try:
    # =========================
    # 1. CREATE ROLES
    # =========================

    admin_role = db.query(Role).filter(Role.role_name == "ADMIN").first()
    if not admin_role:
        admin_role = Role(
            role_id=uuid.uuid4(),
            role_name="ADMIN"
        )
        db.add(admin_role)

    staff_role = db.query(Role).filter(Role.role_name == "STAFF").first()
    if not staff_role:
        staff_role = Role(
            role_id=uuid.uuid4(),
            role_name="STAFF"
        )
        db.add(staff_role)

    db.commit()

    db.refresh(admin_role)
    db.refresh(staff_role)

    # =========================
    # 2. CREATE ADMIN USER
    # =========================

    admin_user = db.query(UserAccount).filter(UserAccount.username == "admin").first()
    if not admin_user:
        admin_user = UserAccount(
            full_name="System Admin",
            email="admin@example.com",
            username="admin",
            password_hash=hash_password("admin123"),
            role_id=admin_role.role_id,
            is_active=True
        )
        db.add(admin_user)
        print("✅ Admin user created")

    # =========================
    # 3. CREATE STAFF USER
    # =========================

    staff_user = db.query(UserAccount).filter(UserAccount.username == "staff").first()
    if not staff_user:
        staff_user = UserAccount(
            full_name="Staff User",
            email="staff@example.com",
            username="gerfel",
            password_hash=hash_password("staff123"),
            role_id=staff_role.role_id,
            is_active=True
        )
        db.add(staff_user)
        print("✅ Staff user created")

    db.commit()

    print("🎉 Seeding complete: ADMIN + STAFF + roles ready")

except Exception as e:
    db.rollback()
    print("❌ Seeding error:", e)

finally:
    db.close()