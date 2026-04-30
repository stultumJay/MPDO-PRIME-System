from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.finance import FundSource, Appropriation, AppropriationFundSource
from app.models.allotment import Allotment
from app.models.obligation import Obligation
from app.models.disbursement import Disbursement
from app.models.project import Project
from app.models.project_aip import ProjectAIP
from app.models.user import UserAccount
from app.schemas.finance import (
    FundSourceCreate, FundSourceUpdate, FundSourceResponse,
    AppropriationCreate, AppropriationUpdate, AppropriationResponse,
    AppropriationFundSourceCreate, AppropriationFundSourceUpdate,
    AppropriationFundSourceResponse,
    ExpenseClassLine, ProjectFinancialLedger, ProjectFinancialSummary,
    FinanceLedgerAllotment, FinanceLedgerDisbursement,
    FinanceLedgerFundSource, FinanceLedgerObligation,
    VALID_EXPENSE_CLASSES,
)

_Z = Decimal("0.00")


# ══════════════════════════════════════════════════════════════════════════
# FundSource
# ══════════════════════════════════════════════════════════════════════════

def create_fund_source(db: Session, data: FundSourceCreate) -> FundSourceResponse:
    """
    This creates the fund source record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    fs = FundSource(**data.model_dump())
    db.add(fs)
    db.commit()
    db.refresh(fs)
    return FundSourceResponse.model_validate(fs)


def get_fund_sources(db: Session) -> List[FundSourceResponse]:
    """
    This gets the fund sources data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    rows = (
        db.query(FundSource)
        .filter(FundSource.is_active.is_(True))
        .order_by(FundSource.fund_category, FundSource.fund_name)
        .all()
    )
    return [FundSourceResponse.model_validate(r) for r in rows]


def get_fund_source(db: Session, fund_source_id: UUID) -> FundSource:
    """
    This gets the fund source data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    fs = db.query(FundSource).filter(
        FundSource.fund_source_id == fund_source_id,
        FundSource.is_active.is_(True),
    ).first()
    if not fs:
        raise HTTPException(404, "Fund source not found.")
    return fs


def update_fund_source(
    db: Session, fund_source_id: UUID, data: FundSourceUpdate
) -> FundSourceResponse:
    """
    This updates the fund source record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    fs = get_fund_source(db, fund_source_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(fs, field, value)
    db.commit()
    db.refresh(fs)
    return FundSourceResponse.model_validate(fs)


def delete_fund_source(db: Session, fund_source_id: UUID) -> dict:
    """
    This removes or deactivates the fund source record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    fs = get_fund_source(db, fund_source_id)
    fs.is_active = False
    db.commit()
    return {"detail": f"Fund source '{fs.fund_name}' deactivated."}


# ══════════════════════════════════════════════════════════════════════════
# Appropriation
# ══════════════════════════════════════════════════════════════════════════

def create_appropriation(
    db: Session, data: AppropriationCreate, current_user: UserAccount
) -> AppropriationResponse:
    """
    This creates the appropriation record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    # An appropriation must always point to a live AIP row because it is part of that budgeting chain
    if not db.query(ProjectAIP).filter(
        ProjectAIP.project_aip_id == data.project_aip_id,
        ProjectAIP.is_active.is_(True),
    ).first():
        raise HTTPException(404, "AIP entry not found or inactive.")

    # created_by comes from the signed in user instead of trusting the request body for that value
    appropriation = Appropriation(
        **data.model_dump(),
        created_by=current_user.user_id,
    )
    db.add(appropriation)
    db.commit()
    db.refresh(appropriation)
    return AppropriationResponse.model_validate(appropriation)


def get_appropriations(
    db: Session, project_aip_id: Optional[UUID] = None
) -> List[AppropriationResponse]:
    """
    This gets the appropriations data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Appropriation).filter(Appropriation.is_active.is_(True))
    if project_aip_id:
        q = q.filter(Appropriation.project_aip_id == project_aip_id)
    return [AppropriationResponse.model_validate(r) for r in q.all()]


def get_appropriation(db: Session, appropriation_id: UUID) -> Appropriation:
    """
    This gets the appropriation data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    a = db.query(Appropriation).filter(
        Appropriation.appropriation_id == appropriation_id,
        Appropriation.is_active.is_(True),
    ).first()
    if not a:
        raise HTTPException(404, "Appropriation not found.")
    return a


def update_appropriation(
    db: Session, appropriation_id: UUID, data: AppropriationUpdate
) -> AppropriationResponse:
    """
    This updates the appropriation record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    a = get_appropriation(db, appropriation_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(a, field, value)
    db.commit()
    db.refresh(a)
    return AppropriationResponse.model_validate(a)


def delete_appropriation(db: Session, appropriation_id: UUID) -> dict:
    """
    This removes or deactivates the appropriation record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    a = get_appropriation(db, appropriation_id)
    has_sources = db.query(AppropriationFundSource).filter(
        AppropriationFundSource.appropriation_id == appropriation_id
    ).count()
    if has_sources:
        raise HTTPException(
            409,
            "Cannot deactivate — this appropriation has linked fund sources. "
            "Remove them first.",
        )
    a.is_active = False
    db.commit()
    return {"detail": "Appropriation deactivated."}


# ══════════════════════════════════════════════════════════════════════════
# AppropriationFundSource
# ══════════════════════════════════════════════════════════════════════════

def create_appr_fund_source(
    db: Session, data: AppropriationFundSourceCreate
) -> AppropriationFundSourceResponse:
    """
    This creates the appr fund source record for the service layer
    It checks the needed records first, saves the new values, and returns the fresh result
    """
    # The parent appropriation must exist before a fund source line can be attached to it
    get_appropriation(db, data.appropriation_id)

    # The selected fund source must also exist so the ledger has a valid reference on both sides
    get_fund_source(db, data.fund_source_id)

    # No duplicate (appropriation, fund_source, expense_class) per DB constraint —
    # but give a friendlier error than an integrity violation.
    dup = db.query(AppropriationFundSource).filter(
        AppropriationFundSource.appropriation_id == data.appropriation_id,
        AppropriationFundSource.fund_source_id   == data.fund_source_id,
        AppropriationFundSource.expense_class    == data.expense_class,
    ).first()
    if dup:
        raise HTTPException(
            409,
            f"An appropriation for {data.expense_class} under this fund source "
            "already exists for this appropriation.",
        )

    afs = AppropriationFundSource(**data.model_dump())
    db.add(afs)
    db.commit()
    db.refresh(afs)
    return AppropriationFundSourceResponse.model_validate(afs)


def get_appr_fund_sources(
    db: Session, appropriation_id: UUID
) -> List[AppropriationFundSourceResponse]:
    """
    This gets the appr fund sources data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    rows = db.query(AppropriationFundSource).filter(
        AppropriationFundSource.appropriation_id == appropriation_id
    ).all()
    return [AppropriationFundSourceResponse.model_validate(r) for r in rows]


def get_appr_fund_source(db: Session, appr_fund_source_id: UUID) -> AppropriationFundSource:
    """
    This gets the appr fund source data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    afs = db.query(AppropriationFundSource).filter(
        AppropriationFundSource.appr_fund_source_id == appr_fund_source_id
    ).first()
    if not afs:
        raise HTTPException(404, "Appropriation fund source not found.")
    return afs


def update_appr_fund_source(
    db: Session,
    appr_fund_source_id: UUID,
    data: AppropriationFundSourceUpdate,
) -> AppropriationFundSourceResponse:
    """
    This updates the appr fund source record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    afs = get_appr_fund_source(db, appr_fund_source_id)

    if data.appropriated_amount is not None:
        # This blocks shrinking the appropriation line below money that has already been released from it
        total_allotted = db.query(
            func.coalesce(func.sum(Allotment.amount_released), _Z)
        ).filter(
            Allotment.appr_fund_source_id == appr_fund_source_id
        ).scalar() or _Z

        if data.appropriated_amount < total_allotted:
            raise HTTPException(
                400,
                f"Cannot reduce appropriated amount to {data.appropriated_amount:,.2f}. "
                f"Total already allotted: {total_allotted:,.2f}.",
            )
        afs.appropriated_amount = data.appropriated_amount

    db.commit()
    db.refresh(afs)
    return AppropriationFundSourceResponse.model_validate(afs)


def delete_appr_fund_source(db: Session, appr_fund_source_id: UUID) -> dict:
    """
    This removes or deactivates the appr fund source record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    afs = get_appr_fund_source(db, appr_fund_source_id)
    has_allotments = db.query(Allotment).filter(
        Allotment.appr_fund_source_id == appr_fund_source_id
    ).count()
    if has_allotments:
        raise HTTPException(
            409,
            "Cannot delete — this fund source has existing allotments. "
            "Remove all allotments first.",
        )
    db.delete(afs)
    db.commit()
    return {"detail": "Appropriation fund source deleted."}


# ══════════════════════════════════════════════════════════════════════════
# Financial Summary
# ══════════════════════════════════════════════════════════════════════════

def get_project_financial_summary(
    db: Session, project_id: UUID
) -> ProjectFinancialSummary:
    """
    This gets the project financial summary data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    # This summary walks one project through the full budget chain for each expense class
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.is_active.is_(True),
    ).first()
    if not project:
        raise HTTPException(404, "Project not found.")

    lines: List[ExpenseClassLine] = []
    total_appr = total_allot = total_oblig = total_disb = _Z

    for ec in ("PS", "MOOE", "FE", "CO"):
        # Each query below follows the same project but stops at a different stage of the money flow
        # That makes it easier to compare what was appropriated, released, obligated, and finally paid
        appr: Decimal = db.query(
            func.coalesce(func.sum(AppropriationFundSource.appropriated_amount), _Z)
        ).join(
            Appropriation,
            AppropriationFundSource.appropriation_id == Appropriation.appropriation_id,
        ).join(
            ProjectAIP,
            Appropriation.project_aip_id == ProjectAIP.project_aip_id,
        ).filter(
            ProjectAIP.project_id == project_id,
            AppropriationFundSource.expense_class == ec,
        ).scalar() or _Z

        # Sum allotted (through appr_fund_source chain)
        allot: Decimal = db.query(
            func.coalesce(func.sum(Allotment.amount_released), _Z)
        ).join(
            AppropriationFundSource,
            Allotment.appr_fund_source_id == AppropriationFundSource.appr_fund_source_id,
        ).join(
            Appropriation,
            AppropriationFundSource.appropriation_id == Appropriation.appropriation_id,
        ).join(
            ProjectAIP,
            Appropriation.project_aip_id == ProjectAIP.project_aip_id,
        ).filter(
            ProjectAIP.project_id == project_id,
            AppropriationFundSource.expense_class == ec,
        ).scalar() or _Z

        # Sum obligated
        oblig: Decimal = db.query(
            func.coalesce(func.sum(Obligation.obligation_amount), _Z)
        ).join(
            Allotment,
            Obligation.allotment_id == Allotment.allotment_id,
        ).join(
            AppropriationFundSource,
            Allotment.appr_fund_source_id == AppropriationFundSource.appr_fund_source_id,
        ).join(
            Appropriation,
            AppropriationFundSource.appropriation_id == Appropriation.appropriation_id,
        ).join(
            ProjectAIP,
            Appropriation.project_aip_id == ProjectAIP.project_aip_id,
        ).filter(
            ProjectAIP.project_id == project_id,
            AppropriationFundSource.expense_class == ec,
        ).scalar() or _Z

        # Sum disbursed
        disb: Decimal = db.query(
            func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
        ).join(
            Obligation,
            Disbursement.obligation_id == Obligation.obligation_id,
        ).join(
            Allotment,
            Obligation.allotment_id == Allotment.allotment_id,
        ).join(
            AppropriationFundSource,
            Allotment.appr_fund_source_id == AppropriationFundSource.appr_fund_source_id,
        ).join(
            Appropriation,
            AppropriationFundSource.appropriation_id == Appropriation.appropriation_id,
        ).join(
            ProjectAIP,
            Appropriation.project_aip_id == ProjectAIP.project_aip_id,
        ).filter(
            ProjectAIP.project_id == project_id,
            AppropriationFundSource.expense_class == ec,
        ).scalar() or _Z

        lines.append(ExpenseClassLine(
            expense_class    = ec,
            appropriated     = appr,
            allotted         = allot,
            obligated        = oblig,
            disbursed        = disb,
            unallotted       = appr  - allot,
            unobligated      = allot - oblig,
            accounts_payable = oblig - disb,
        ))

        total_appr  += appr
        total_allot += allot
        total_oblig += oblig
        total_disb  += disb

    return ProjectFinancialSummary(
        project_id             = project.project_id,
        project_code           = project.project_code,
        lines                  = lines,
        total_appropriated     = total_appr,
        total_allotted         = total_allot,
        total_obligated        = total_oblig,
        total_disbursed        = total_disb,
        total_unallotted       = total_appr  - total_allot,
        total_unobligated      = total_allot - total_oblig,
        total_accounts_payable = total_oblig - total_disb,
    )


def get_project_financial_ledger(
    db: Session, project_id: UUID
) -> ProjectFinancialLedger:
    """
    This gets the project financial ledger data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    # This ledger pulls the raw rows first, then builds small running totals so each stage can show its balance
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.is_active.is_(True),
    ).first()
    if not project:
        raise HTTPException(404, "Project not found.")

    source_rows = (
        db.query(AppropriationFundSource)
        .join(
            Appropriation,
            AppropriationFundSource.appropriation_id == Appropriation.appropriation_id,
        )
        .join(
            ProjectAIP,
            Appropriation.project_aip_id == ProjectAIP.project_aip_id,
        )
        .filter(
            ProjectAIP.project_id == project_id,
            ProjectAIP.is_active.is_(True),
            Appropriation.is_active.is_(True),
        )
        .all()
    )

    source_ids = [row.appr_fund_source_id for row in source_rows]
    allotment_rows = (
        db.query(Allotment)
        .filter(Allotment.appr_fund_source_id.in_(source_ids))
        .order_by(Allotment.release_date)
        .all()
        if source_ids else []
    )

    allotment_ids = [row.allotment_id for row in allotment_rows]
    obligation_rows = (
        db.query(Obligation)
        .filter(Obligation.allotment_id.in_(allotment_ids))
        .order_by(Obligation.obligation_date)
        .all()
        if allotment_ids else []
    )

    obligation_ids = [row.obligation_id for row in obligation_rows]
    disbursement_rows = (
        db.query(Disbursement)
        .filter(Disbursement.obligation_id.in_(obligation_ids))
        .order_by(Disbursement.disbursement_date)
        .all()
        if obligation_ids else []
    )

    # These small maps let the response show balances without running a new query for every single row
    allotted_by_source = {source_id: _Z for source_id in source_ids}
    for row in allotment_rows:
        allotted_by_source[row.appr_fund_source_id] = (
            allotted_by_source.get(row.appr_fund_source_id, _Z)
            + Decimal(str(row.amount_released or _Z))
        )

    obligated_by_allotment = {allotment_id: _Z for allotment_id in allotment_ids}
    for row in obligation_rows:
        obligated_by_allotment[row.allotment_id] = (
            obligated_by_allotment.get(row.allotment_id, _Z)
            + Decimal(str(row.obligation_amount or _Z))
        )

    disbursed_by_obligation = {obligation_id: _Z for obligation_id in obligation_ids}
    for row in disbursement_rows:
        disbursed_by_obligation[row.obligation_id] = (
            disbursed_by_obligation.get(row.obligation_id, _Z)
            + Decimal(str(row.disbursement_amount or _Z))
        )

    fund_sources = []
    for row in source_rows:
        appropriated = Decimal(str(row.appropriated_amount or _Z))
        allotted = allotted_by_source.get(row.appr_fund_source_id, _Z)
        fund_sources.append(FinanceLedgerFundSource(
            appr_fund_source_id=row.appr_fund_source_id,
            appropriation_id=row.appropriation_id,
            fund_source_id=row.fund_source_id,
            fund_category=row.fund_source.fund_category if row.fund_source else "",
            fund_name=row.fund_source.fund_name if row.fund_source else "",
            expense_class=row.expense_class,
            appropriated_amount=appropriated,
            allotted_total=allotted,
            available_for_allotment=appropriated - allotted,
        ))

    allotments = []
    for row in allotment_rows:
        obligated = obligated_by_allotment.get(row.allotment_id, _Z)
        released = Decimal(str(row.amount_released or _Z))
        allotments.append(FinanceLedgerAllotment(
            allotment_id=row.allotment_id,
            appr_fund_source_id=row.appr_fund_source_id,
            aro_number=row.aro_number,
            amount_released=released,
            release_date=row.release_date,
            remarks=row.remarks,
            obligated_total=obligated,
            free_balance=released - obligated,
        ))

    obligations = []
    for row in obligation_rows:
        disbursed = disbursed_by_obligation.get(row.obligation_id, _Z)
        obligated = Decimal(str(row.obligation_amount or _Z))
        obligations.append(FinanceLedgerObligation(
            obligation_id=row.obligation_id,
            allotment_id=row.allotment_id,
            payee=row.payee,
            reference_document=row.reference_document,
            obligation_amount=obligated,
            obligation_date=row.obligation_date,
            remarks=row.remarks,
            disbursed_total=disbursed,
            unpaid_balance=obligated - disbursed,
        ))

    disbursements = [
        FinanceLedgerDisbursement(
            disbursement_id=row.disbursement_id,
            obligation_id=row.obligation_id,
            payment_method=row.payment_method,
            reference_number=row.reference_number,
            disbursement_amount=Decimal(str(row.disbursement_amount or _Z)),
            disbursement_date=row.disbursement_date,
            remarks=row.remarks,
        )
        for row in disbursement_rows
    ]

    return ProjectFinancialLedger(
        project_id=project.project_id,
        fund_sources=fund_sources,
        allotments=allotments,
        obligations=obligations,
        disbursements=disbursements,
    )