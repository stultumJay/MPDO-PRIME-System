from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    ChangePassword,
    AdminChangePassword,
    UserOut as UserResponse
)

from app.services import user_service
from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import UserAccount

from uuid import UUID

router = APIRouter(prefix="/users", tags=["Users"])


# =========================
# CREATE USER (ADMIN ONLY)
# =========================
@router.post("/", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_roles("ADMIN"))
):
    return user_service.create_user(db, data)


# =========================
# GET ALL USERS (ADMIN ONLY)
# =========================
@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: dict = Depends(require_roles("ADMIN"))
):
    return user_service.get_users(db)


# =========================
# GET SINGLE USER (AUTH REQUIRED)
# =========================
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = user_service.get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# =========================
# UPDATE USER (AUTH REQUIRED)
# =========================
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = user_service.get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user_service.update_user(db, user, data)


# =========================
# DELETE USER (ADMIN ONLY)
# =========================
@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_roles("ADMIN"))
):
    user = user_service.get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_service.delete_user(db, user)
    return {"message": "User deleted successfully"}


# =========================
# CHANGE PASSWORD (AUTH REQUIRED)
# =========================
@router.post("/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_service.change_password(db, user, data.new_password)
    return {"message": "Password updated successfully"}

# =========================
# CHANGE USER PASSWORD (ADMIN ONLY)
# =========================
@router.put("/{user_id}/reset-password")
def admin_reset_password(
    user_id: UUID,
    data: AdminChangePassword,
    db: Session = Depends(get_db),
    _: UserAccount = Depends(require_roles("ADMIN"))
):
    return user_service.admin_reset_password(db, user_id, data.new_password)