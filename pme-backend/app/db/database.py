from sqlalchemy import create_engine
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)