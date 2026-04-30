from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.allotment import Allotment
from app.models.finance import AppropriationFundSource
from app.models.obligation import Obligation
from app.models.user import UserAccount
from app.schemas.allotment import AllotmentCreate, AllotmentUpdate, AllotmentResponse

_Z = Decimal("0.00")


def _get_or_404(db: Session, allotment_id: UUID) -> Allotment:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(Allotment).filter(Allotment.allotment_id == allotment_id).first()
    if not row:
        raise HTTPException(404, "Allotment not found.")
    return row


def _allotted_total(db: Session, appr_fund_source_id: UUID, exclude_id: Optional[UUID] = None) -> Decimal:
    """
    This adds up how much has already been released under one appropriation fund source
    The optional exclude id is used during updates so the current row does not count itself twice
    """
    q = db.query(func.coalesce(func.sum(Allotment.amount_released), _Z)).filter(
        Allotment.appr_fund_source_id == appr_fund_source_id
    )
    if exclude_id:
        q = q.filter(Allotment.allotment_id != exclude_id)
    return q.scalar() or _Z


def create_allotment(
    db: Session, data: AllotmentCreate, current_user: UserAccount
) -> AllotmentResponse:
    """
    This creates an allotment after checking that the parent fund source still has room for it
    It protects the appropriation ceiling before the new release amount is saved
    """
    afs = db.query(AppropriationFundSource).filter(
        AppropriationFundSource.appr_fund_source_id == data.appr_fund_source_id
    ).first()
    if not afs:
        raise HTTPException(404, "Appropriation fund source not found.")

    # This computes the remaining ceiling after older allotments are already counted
    already_allotted = _allotted_total(db, data.appr_fund_source_id)
    available        = Decimal(str(afs.appropriated_amount)) - already_allotted

    if data.amount_released > available:
        raise HTTPException(
            400,
            f"Allotment exceeds available appropriation ceiling. "
            f"Ceiling: {afs.appropriated_amount:,.2f} | "
            f"Already allotted: {already_allotted:,.2f} | "
            f"Available: {available:,.2f} | "
            f"Requested: {data.amount_released:,.2f}.",
        )

    allotment = Allotment(
        appr_fund_source_id = data.appr_fund_source_id,
        aro_number          = data.aro_number,
        amount_released     = data.amount_released,
        release_date        = data.release_date,
        remarks             = data.remarks,
        released_by         = current_user.user_id,
    )
    db.add(allotment)
    db.commit()
    db.refresh(allotment)
    return AllotmentResponse.model_validate(allotment)


def get_allotments(
    db: Session, appr_fund_source_id: Optional[UUID] = None
) -> List[AllotmentResponse]:
    """
    This gets the allotments data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Allotment)
    if appr_fund_source_id:
        q = q.filter(Allotment.appr_fund_source_id == appr_fund_source_id)
    return [AllotmentResponse.model_validate(r) for r in q.order_by(Allotment.release_date).all()]


def get_allotment(db: Session, allotment_id: UUID) -> AllotmentResponse:
    """
    This gets the allotment data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return AllotmentResponse.model_validate(_get_or_404(db, allotment_id))


def update_allotment(
    db: Session, allotment_id: UUID, data: AllotmentUpdate
) -> AllotmentResponse:
    """
    This updates the allotment record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    allotment = _get_or_404(db, allotment_id)

    if data.amount_released is not None:
        # The new allotment amount cannot go below what has already been obligated under it
        total_obligated = db.query(
            func.coalesce(func.sum(Obligation.obligation_amount), _Z)
        ).filter(Obligation.allotment_id == allotment_id).scalar() or _Z

        if data.amount_released < total_obligated:
            raise HTTPException(
                400,
                f"Cannot reduce allotment to {data.amount_released:,.2f}. "
                f"Obligations already total {total_obligated:,.2f}.",
            )

        # This recalculates the ceiling while ignoring the current row so the comparison stays fair
        afs = db.query(AppropriationFundSource).filter(
            AppropriationFundSource.appr_fund_source_id == allotment.appr_fund_source_id
        ).first()
        other_allotted = _allotted_total(db, allotment.appr_fund_source_id, exclude_id=allotment_id)
        available      = Decimal(str(afs.appropriated_amount)) - other_allotted

        if data.amount_released > available:
            raise HTTPException(
                400,
                f"Revised amount {data.amount_released:,.2f} exceeds available ceiling "
                f"({available:,.2f}).",
            )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(allotment, field, value)

    db.commit()
    db.refresh(allotment)
    return AllotmentResponse.model_validate(allotment)


def delete_allotment(db: Session, allotment_id: UUID) -> dict:
    """
    This removes or deactivates the allotment record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    allotment = _get_or_404(db, allotment_id)
    # An allotment with child obligations cannot be removed because that would break the chain below it
    has_obligations = db.query(Obligation).filter(
        Obligation.allotment_id == allotment_id
    ).count()
    if has_obligations:
        raise HTTPException(
            409,
            "Cannot delete — this allotment has linked obligations. "
            "Remove all obligations first.",
        )
    db.delete(allotment)
    db.commit()
    return {"detail": f"Allotment '{allotment.aro_number}' deleted."}