# This older budget router is currently kept as commented reference code
# The active money flow now lives in the finance, allotment, obligation, and disbursement routers
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from uuid import UUID

# from app.db.session import get_db
# from app.core.dependencies import get_current_user
# from app.models.user import UserAccount

# from app.services.budget_service import (
#     create_budget,
#     get_project_budget,
#     update_budget,
# )

# from app.schemas.budget import BudgetCreate, BudgetUpdate

# router = APIRouter(prefix="/budgets", tags=["Budgets"])

# @router.post("/")
# def create(
#     payload: BudgetCreate,
#     db: Session = Depends(get_db),
#     _: UserAccount = Depends(get_current_user),
# ):
#     return create_budget(db, payload)


# @router.get("/project/{project_id}")
# def get_by_project(
#     project_id: UUID,
#     db: Session = Depends(get_db),
#     _: UserAccount = Depends(get_current_user),
# ):
#     return get_project_budget(db, project_id)


# @router.put("/{budget_id}")
# def update(
#     budget_id: UUID,
#     payload: BudgetUpdate,
#     db: Session = Depends(get_db),
#     _: UserAccount = Depends(get_current_user),
# ):
#     return update_budget(db, budget_id, payload)