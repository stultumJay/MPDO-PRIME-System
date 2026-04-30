from fastapi import FastAPI
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.rate_limiter import limiter
from app.db.database import engine
from app.models.base import Base
import app.models  # registers all models

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

# Reference data
app.include_router(office_router.router,       prefix=PREFIX)
app.include_router(sector_router.router,       prefix=PREFIX)
app.include_router(program_router.router,      prefix=PREFIX)

# Project & AIP
app.include_router(project_router.router,      prefix=PREFIX)
app.include_router(aip_router.router,          prefix=PREFIX)

# Financial chain
app.include_router(finance_router.router,      prefix=PREFIX)
app.include_router(allotment_router.router,    prefix=PREFIX)
app.include_router(obligation_router.router,   prefix=PREFIX)
app.include_router(disbursement_router.router, prefix=PREFIX)

# Monitoring
app.include_router(performance_router.router,  prefix=PREFIX)
app.include_router(phase_config_router.router, prefix=PREFIX)
app.include_router(progress_router.router,     prefix=PREFIX)
app.include_router(issue_router.router,        prefix=PREFIX)

# Analytics, reports, map
app.include_router(analytics_router.router,    prefix=PREFIX)
app.include_router(dashboard_router.router,    prefix=PREFIX)
app.include_router(report_router.router,       prefix=PREFIX)
app.include_router(form_router.router,         prefix=PREFIX)
app.include_router(map_router.router,          prefix=PREFIX)

# Audit
app.include_router(audit_router.router,        prefix=PREFIX)

Base.metadata.create_all(bind=engine)