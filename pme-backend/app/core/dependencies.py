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
    """
    This reads the access token from the request and turns it into the signed in user record
    It stops early when the token is bad, the user is missing, or the account is already inactive
    """
    # Decode the token first so we can read who the request claims to be
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(401, "Invalid token")

    # The token stores the user id in the subject field, so that is what we use for lookup
    user = db.query(UserAccount).filter(
        UserAccount.user_id == UUID(payload["sub"])
    ).first()

    if not user:
        raise HTTPException(404, "User not found")
    
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account was deactivated"
        )

    return user


def require_roles(*roles):
    """
    This creates a reusable role check for routes that should only allow certain user roles
    The route can plug this in and let the inner checker block the wrong accounts
    """
    def role_checker(user=Depends(get_current_user)):
        """
        This runs after the signed in user has already been loaded
        It compares the user role name with the allowed role names for the route
        """
        if user.role.role_name not in roles:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )
        return user

    return role_checker