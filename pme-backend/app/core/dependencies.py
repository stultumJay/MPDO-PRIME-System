from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import UserAccount
from uuid import UUID


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(401, "Invalid token")

    user = db.query(UserAccount).filter(
    UserAccount.user_id == UUID(payload["sub"])
).first()

    if not user:
        raise HTTPException(404, "User not found")

    return user


def require_roles(*roles):
    def role_checker(user=Depends(get_current_user)):
        if user.role.role_name not in roles:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )
        return user

    return role_checker
