from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    """
    This turns the plain password into a hashed value before it is saved
    That way the database never keeps the raw password text
    """
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str):
    """
    This checks whether the login password matches the hashed password already stored
    The route only lets the user in when this comparison comes back true
    """
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict):
    """
    This builds the short lived access token used on protected requests
    It copies the user payload, adds the expiry time, and marks the token as an access token
    """
    # Copy the payload first so the original caller data stays unchanged
    to_encode = data.copy()
    # Access tokens are meant for normal API calls, so they expire sooner
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})

    # The final encoded string is what the frontend sends back in the Authorization header
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(data: dict):
    """
    This builds the longer lived refresh token used to ask for a new access token later
    It keeps the same user identity but uses a different token type and expiry window
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str):
    """
    This reads the token and returns the payload when the signature and expiry are still valid
    It quietly returns nothing when the token is broken or already expired
    """
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None