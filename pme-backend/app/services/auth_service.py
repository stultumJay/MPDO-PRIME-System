from sqlalchemy.orm import Session
from app.models.user import UserAccount
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)


def login(db: Session, username: str, password: str):
    user = db.query(UserAccount).filter(
        UserAccount.username == username
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    payload = {"sub": str(user.user_id)}

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


def refresh_access_token(refresh_token: str):
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        return None

    new_access = create_access_token({"sub": payload["sub"]})

    return new_access