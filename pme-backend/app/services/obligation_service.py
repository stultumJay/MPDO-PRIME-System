from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.allotment import Allotment
from app.models.disbursement import Disbursement
from app.models.obligation import Obligation
from app.models.user import UserAccount
from app.schemas.obligation import ObligationCreate, ObligationUpdate, ObligationResponse
from app.services.audit_service import log_activity

_Z = Decimal("0.00")


def _get_or_404(db: Session, obligation_id: UUID) -> Obligation:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(Obligation).filter(Obligation.obligation_id == obligation_id).first()
    if not row:
        raise HTTPException(404, "Obligation not found.")
    return row


def _obligated_total(db: Session, allotment_id: UUID, exclude_id: Optional[UUID] = None) -> Decimal:
    """
    This adds up how much of one allotment has already been obligated
    The optional exclude id is used during updates so the current row can be recalculated cleanly
    """
    q = db.query(func.coalesce(func.sum(Obligation.obligation_amount), _Z)).filter(
        Obligation.allotment_id == allotment_id
    )
    if exclude_id:
        q = q.filter(Obligation.obligation_id != exclude_id)
    return q.scalar() or _Z


def create_obligation(
    db: Session, data: ObligationCreate, current_user: UserAccount
) -> ObligationResponse:
    """
    This creates an obligation after checking that the allotment still has enough free balance
    It keeps the total obligated amount from going past the money already released
    """
    allotment = db.query(Allotment).filter(
        Allotment.allotment_id == data.allotment_id
    ).first()
    if not allotment:
        raise HTTPException(404, "Allotment not found.")

    # Available here means released money that has not yet been tied to older obligations
    total_obligated = _obligated_total(db, data.allotment_id)
    available       = Decimal(str(allotment.amount_released)) - total_obligated

    if data.obligation_amount > available:
        raise HTTPException(
            400,
            f"Obligation exceeds free allotment balance. "
            f"Allotted: {allotment.amount_released:,.2f} | "
            f"Already obligated: {total_obligated:,.2f} | "
            f"Available: {available:,.2f} | "
            f"Requested: {data.obligation_amount:,.2f}.",
        )

    obligation = Obligation(
        allotment_id       = data.allotment_id,
        payee              = data.payee,
        reference_document = data.reference_document,
        obligation_amount  = data.obligation_amount,
        obligation_date    = data.obligation_date,
        remarks            = data.remarks,
        created_by         = current_user.user_id,
    )
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    log_activity(
        db,
        "Create",
        "Obligation",
        obligation.obligation_id,
        f"Created obligation {obligation.reference_document} for {obligation.payee}.",
        current_user.user_id,
    )
    return ObligationResponse.model_validate(obligation)


def get_obligations(
    db: Session, allotment_id: Optional[UUID] = None
) -> List[ObligationResponse]:
    """
    This gets the obligations data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Obligation)
    if allotment_id:
        q = q.filter(Obligation.allotment_id == allotment_id)
    return [ObligationResponse.model_validate(r) for r in q.order_by(Obligation.obligation_date).all()]


def get_obligation(db: Session, obligation_id: UUID) -> ObligationResponse:
    """
    This gets the obligation data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return ObligationResponse.model_validate(_get_or_404(db, obligation_id))


def update_obligation(
    db: Session, obligation_id: UUID, data: ObligationUpdate
) -> ObligationResponse:
    """
    This updates the obligation record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    obligation = _get_or_404(db, obligation_id)

    if data.obligation_amount is not None:
        # Cannot drop below total disbursed
        total_disbursed = db.query(
            func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)
        ).filter(Disbursement.obligation_id == obligation_id).scalar() or _Z

        if data.obligation_amount < total_disbursed:
            raise HTTPException(
                400,
                f"Cannot reduce obligation to {data.obligation_amount:,.2f}. "
                f"Disbursements already total {total_disbursed:,.2f}.",
            )

        # The revised amount is checked against the same allotment after removing this row from the running total
        allotment      = db.query(Allotment).filter(
            Allotment.allotment_id == obligation.allotment_id
        ).first()
        other_obligated = _obligated_total(db, obligation.allotment_id, exclude_id=obligation_id)
        available       = Decimal(str(allotment.amount_released)) - other_obligated

        if data.obligation_amount > available:
            raise HTTPException(
                400,
                f"Revised amount {data.obligation_amount:,.2f} exceeds free "
                f"allotment balance ({available:,.2f}).",
            )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obligation, field, value)

    db.commit()
    db.refresh(obligation)
    return ObligationResponse.model_validate(obligation)


def delete_obligation(db: Session, obligation_id: UUID) -> dict:
    """
    This removes or deactivates the obligation record
    It loads the current row first so the service can return a clear error when the record is missing
    """
    obligation = _get_or_404(db, obligation_id)
    # Once disbursements exist, the obligation has become a parent row and should stay in place
    has_disbursements = db.query(Disbursement).filter(
        Disbursement.obligation_id == obligation_id
    ).count()
    if has_disbursements:
        raise HTTPException(
            409,
            "Cannot delete — this obligation has linked disbursements. "
            "Remove all disbursements first.",
        )
    db.delete(obligation)
    db.commit()
    return {"detail": "Obligation deleted."}