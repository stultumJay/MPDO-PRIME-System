from sqlalchemy.orm import Session
from app.models.user import UserAccount
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)


def login(db: Session, username: str, password: str):
    """
    This checks the login details and creates the token response for the signed in user
    It only returns tokens when the username, password, and user status all pass the checks
    """
    user = db.query(UserAccount).filter(
        UserAccount.username == username
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None
    
    if not user.is_active:
        return None

    payload = {"sub": str(user.user_id)}

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


def refresh_access_token(refresh_token: str):
    """
    This reads the refresh token and creates a new access token for the same user
    It keeps the session going without asking the user to log in again right away
    """
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        return None

    new_access = create_access_token({"sub": payload["sub"]})

    return new_access