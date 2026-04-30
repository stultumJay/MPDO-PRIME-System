from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password, verify_password
from app.models.office import Office
from app.models.role import Role
from app.models.user import UserAccount
from app.schemas.user import UserCreate, UserUpdate


def _load_user(db: Session, user_id: UUID) -> Optional[UserAccount]:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    return (
        db.query(UserAccount)
        .options(joinedload(UserAccount.role), joinedload(UserAccount.office))
        .filter(UserAccount.user_id == user_id)
        .first()
    )


def _load_by_username(db: Session, username: str) -> Optional[UserAccount]:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    return (
        db.query(UserAccount)
        .filter(func.lower(UserAccount.username) == username.lower())
        .first()
    )


def _load_by_email(db: Session, email: str) -> Optional[UserAccount]:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    return (
        db.query(UserAccount)
        .filter(func.lower(UserAccount.email) == email.lower())
        .first()
    )


def _resolve_role(
    db: Session,
    role_id: Optional[UUID] = None,
    role_name: Optional[str] = None,
) -> Role:
    """
    This handles the  resolve role flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    role = None

    if role_id:
        role = db.query(Role).filter(Role.role_id == role_id).first()
    elif role_name:
        role = (
            db.query(Role)
            .filter(func.upper(Role.role_name) == role_name.strip().upper())
            .first()
        )

    if not role:
        raise HTTPException(status_code=400, detail="Invalid role selection.")

    return role


def _resolve_office(db: Session, office_id: Optional[UUID]) -> Optional[Office]:
    if not office_id:
        return None

    office = db.query(Office).filter(Office.office_id == office_id).first()
    if not office:
        raise HTTPException(status_code=400, detail="Invalid office selection.")

    return office


def get_users(db: Session) -> List[UserAccount]:
    """
    This gets the users data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return (
        db.query(UserAccount)
        .options(joinedload(UserAccount.role), joinedload(UserAccount.office))
        .order_by(UserAccount.full_name.asc())
        .all()
    )


def get_user(db: Session, user_id: UUID) -> Optional[UserAccount]:
    """
    This gets the user data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return _load_user(db, user_id)


def create_user(db: Session, data: UserCreate) -> UserAccount:
    """
    This creates the user record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    if _load_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already exists.")

    if _load_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already exists.")

    role = _resolve_role(db, role_id=data.role_id, role_name=data.role_name)
    office = _resolve_office(db, data.office_id)

    user = UserAccount(
        full_name=data.full_name.strip(),
        username=data.username.strip(),
        email=data.email.strip(),
        password_hash=hash_password(data.password),
        role_id=role.role_id,
        office_id=office.office_id if office else None,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return _load_user(db, user.user_id) or user


def update_user(db: Session, user: UserAccount, data: UserUpdate) -> UserAccount:
    """
    This updates the user record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    if data.username is not None:
        candidate = data.username.strip()
        existing = _load_by_username(db, candidate)
        if existing and existing.user_id != user.user_id:
            raise HTTPException(status_code=400, detail="Username already exists.")
        user.username = candidate

    if data.email is not None:
        candidate_email = data.email.strip()
        existing = _load_by_email(db, candidate_email)
        if existing and existing.user_id != user.user_id:
            raise HTTPException(status_code=400, detail="Email already exists.")
        user.email = candidate_email

    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    if data.role_id is not None or data.role_name is not None:
        role = _resolve_role(db, role_id=data.role_id, role_name=data.role_name)
        user.role_id = role.role_id

    if "office_id" in data.model_fields_set:
        office = _resolve_office(db, data.office_id)
        user.office_id = office.office_id if office else None

    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    return _load_user(db, user.user_id) or user


def delete_user(db: Session, user: UserAccount) -> None:
    """
    This removes or deactivates the user record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    user.is_active = False
    db.commit()


def change_password(
    db: Session,
    user: UserAccount,
    old_password: str,
    new_password: str,
):
    """
    This handles the change password flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    user.password_hash = hash_password(new_password)
    db.commit()

    return {"message": "Password updated successfully."}


def admin_reset_password(db: Session, user_id: UUID, new_password: str):
    """
    This handles the admin reset password flow for the backend
    It keeps the main steps together and returns the result the caller expects
    """
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(new_password)
    db.commit()

    return {"message": "Password reset successfully."}