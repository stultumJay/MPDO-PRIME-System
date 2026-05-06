from fastapi import FastAPI
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.rate_limiter import limiter
from app.db.database import engine
from app.models.base import Base
import app.models  # registers all models

from app.config import settings

from app.routers.api.v1 import (
    auth_router,
    user_router,
    office_router,
    sector_router,
    program_router,
    project_router,
    aip_router,
    finance_router,
    allotment_router,
    obligation_router,
    disbursement_router,
    performance_router,
    phase_config_router,
    progress_router,
    analytics_router,
    audit_router,
    issue_router,
    map_router,
    report_router,
    form_router,
    dashboard_router,
)

app = FastAPI(title="MPDO PRIME System", version="1.0.0")

# ─────────────────────────────────────────────
# CORS (PRODUCTION SAFE)
# ─────────────────────────────────────────────
allowed_origins = [
    settings.FRONTEND_PME_URL,
    settings.FRONTEND_DOC_TRACKING_URL,
    settings.FRONTEND_CLEARANCE_URL,
]

# Remove None values
allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# RATE LIMITER
# ─────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

PREFIX = "/api/v1"

# ─────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────
app.include_router(auth_router.router,         prefix=PREFIX)
app.include_router(user_router.router,         prefix=PREFIX)

app.include_router(office_router.router,       prefix=PREFIX)
app.include_router(sector_router.router,       prefix=PREFIX)
app.include_router(program_router.router,      prefix=PREFIX)

app.include_router(project_router.router,      prefix=PREFIX)
app.include_router(aip_router.router,          prefix=PREFIX)

app.include_router(finance_router.router,      prefix=PREFIX)
app.include_router(allotment_router.router,    prefix=PREFIX)
app.include_router(obligation_router.router,   prefix=PREFIX)
app.include_router(disbursement_router.router, prefix=PREFIX)

app.include_router(performance_router.router,  prefix=PREFIX)
app.include_router(phase_config_router.router, prefix=PREFIX)
app.include_router(progress_router.router,     prefix=PREFIX)
app.include_router(issue_router.router,        prefix=PREFIX)

app.include_router(analytics_router.router,    prefix=PREFIX)
app.include_router(dashboard_router.router,    prefix=PREFIX)
app.include_router(report_router.router,       prefix=PREFIX)
app.include_router(form_router.router,         prefix=PREFIX)
app.include_router(map_router.router,          prefix=PREFIX)

app.include_router(audit_router.router,        prefix=PREFIX)

# ─────────────────────────────────────────────
# DATABASE TABLE CREATION
# ─────────────────────────────────────────────
Base.metadata.create_all(bind=engine)