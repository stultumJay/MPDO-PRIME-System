from http.client import HTTPException

from sqlalchemy.orm import Session
from app.models.user import UserAccount
from app.core.security import hash_password, verify_password
from uuid import UUID


def create_user(db: Session, data):
    user = UserAccount(
        full_name=data.full_name,
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        role_id=data.role_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_users(db: Session):
    return db.query(UserAccount).all()


def get_user(db: Session, user_id: int):
    return db.query(UserAccount).filter(UserAccount.user_id == user_id).first()


def update_user(db: Session, user, data):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user):
    db.delete(user)
    db.commit()
    
def change_password(db: Session, user: UserAccount, old_password: str, new_password: str):

    if not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    user.password_hash = hash_password(new_password)

    db.commit()
    db.refresh(user)

    return {"message": "Password updated successfully"}
    
def admin_reset_password(db: Session, user_id: UUID, new_password: str):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    user.password_hash = hash_password(new_password)

    db.commit()
    return {"message": "Password reset successful"}