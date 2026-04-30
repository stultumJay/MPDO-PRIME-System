from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.finance import Appropriation, AppropriationFundSource
from app.models.allotment import Allotment
from app.models.obligation import Obligation
from app.models.disbursement import Disbursement

_Z = Decimal("0.00")


def get_budget_overview(db: Session):
    """
    This gets the budget overview data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    allocated = db.query(
        func.coalesce(func.sum(Allotment.amount_released), _Z)
    ).scalar() or _Z

    disbursed = db.query(
        func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
    ).scalar() or _Z

    return {
        "total_allocation":   allocated,
        "total_disbursement": disbursed,
        "remaining_balance":  allocated - disbursed,
    }


def get_budget_table(db: Session):
    """
    FIX: each row now scopes allotments and disbursements to its own project
    via the full financial chain:
      Project → ProjectAIP → Appropriation → AppropriationFundSource
              → Allotment → Obligation → Disbursement
    """
    projects = db.query(Project).filter(Project.is_active.is_(True)).all()
    result = []

    for p in projects:
        # Subquery: all appr_fund_source_ids for this project
        afs_ids = (
            db.query(AppropriationFundSource.appr_fund_source_id)
            .join(Appropriation,
                  AppropriationFundSource.appropriation_id == Appropriation.appropriation_id)
            .join(ProjectAIP,
                  Appropriation.project_aip_id == ProjectAIP.project_aip_id)
            .filter(ProjectAIP.project_id == p.project_id)
            .subquery()
        )

        # Allotments for this project
        allocated: Decimal = db.query(
            func.coalesce(func.sum(Allotment.amount_released), _Z)
        ).filter(Allotment.appr_fund_source_id.in_(afs_ids)).scalar() or _Z

        # Obligations for this project
        allot_ids = (
            db.query(Allotment.allotment_id)
            .filter(Allotment.appr_fund_source_id.in_(afs_ids))
            .subquery()
        )
        oblig_ids = (
            db.query(Obligation.obligation_id)
            .filter(Obligation.allotment_id.in_(allot_ids))
            .subquery()
        )

        disbursed: Decimal = db.query(
            func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
        ).filter(Disbursement.obligation_id.in_(oblig_ids)).scalar() or _Z

        utilization = (disbursed / allocated * 100) if allocated else _Z

        result.append({
            "project_id":          str(p.project_id),
            "project_code":        p.project_code,
            "title":               p.project_title,
            "allocation":          allocated,
            "utilized":            disbursed,
            "utilization_percent": round(float(utilization), 2),
            "balance":             allocated - disbursed,
        })

    return result