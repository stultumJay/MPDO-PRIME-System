from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends
from typing import Generator
from app.db.database import engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()