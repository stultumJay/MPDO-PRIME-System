from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SQL_ECHO: bool = False

    JWT_SECRET_KEY: str = "supersecret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ─────────────────────────────
    # External Integrations
    # ─────────────────────────────
    DOCUMENT_TRACKING_API_BASE_URL: Optional[str] = None
    DOCUMENT_TRACKING_API_KEY: Optional[str] = None

    LOCATIONAL_CLEARANCE_API_BASE_URL: Optional[str] = None
    LOCATIONAL_CLEARANCE_API_KEY: Optional[str] = None
    EXTERNAL_API_TIMEOUT_SECONDS: int=10


settings = Settings()