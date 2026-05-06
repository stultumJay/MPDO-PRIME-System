from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import TokenResponse
from app.services.auth_service import login, refresh_access_token
from app.db.session import get_db
from app.core.rate_limiter import limiter
from app.core.security import decode_token


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login_user(
    request: Request, 
    data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
    ):
    
    """
    This route creates the login user flow and passes the request into the service layer
    It expects username as str and password as str from the login form
    """
    tokens = login(db, data.username, data.password)

    if not tokens:
        raise HTTPException(401, "Invalid credentials")

    return tokens


@router.post("/refresh")
def refresh_token(refresh_token: str):
    """
    This route creates the refresh token flow and passes the request into the service layer
    It expects refresh_token as str
    """
    new_access = refresh_access_token(refresh_token)

    if not new_access:
        raise HTTPException(401, "Invalid refresh token")

    return {"access_token": new_access}