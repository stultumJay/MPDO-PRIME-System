from fastapi import FastAPI
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.rate_limiter import limiter
from app.db.database import engine
from app.models.base import Base
import app.models

from app.routers.api.v1 import (
    auth_router,
    user_router)

app = FastAPI(title="MPDO PRIME System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

PREFIX = "/api/v1"

# Core auth & users
app.include_router(auth_router.router,         prefix=PREFIX)
app.include_router(user_router.router,         prefix=PREFIX)

Base.metadata.create_all(bind=engine)