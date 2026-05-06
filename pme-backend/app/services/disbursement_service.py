from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.disbursement import Disbursement
from app.models.obligation import Obligation
from app.models.user import UserAccount
from app.schemas.disbursement import DisbursementCreate, DisbursementUpdate, DisbursementResponse
from app.services.audit_service import log_activity

_Z = Decimal("0.00")


def _get_or_404(db: Session, disbursement_id: UUID) -> Disbursement:
    """
    This helper loads the record needed by the next step
    It stops early with a clear not found error when the record does not exist
    """
    row = db.query(Disbursement).filter(
        Disbursement.disbursement_id == disbursement_id
    ).first()
    if not row:
        raise HTTPException(404, "Disbursement not found.")
    return row


def _disbursed_total(db: Session, obligation_id: UUID, exclude_id: Optional[UUID] = None) -> Decimal:
    """
    This adds up how much has already been paid out under one obligation
    The optional exclude id is used when the current row is being edited
    """
    q = db.query(func.coalesce(func.sum(Disbursement.disbursement_amount), _Z)).filter(
        Disbursement.obligation_id == obligation_id
    )
    if exclude_id:
        q = q.filter(Disbursement.disbursement_id != exclude_id)
    return q.scalar() or _Z


def create_disbursement(
    db: Session, data: DisbursementCreate, current_user: UserAccount
) -> DisbursementResponse:
    """
    This creates a disbursement after checking that the obligation still has unpaid balance left
    It keeps payments from going past the amount that was originally obligated
    """
    obligation = db.query(Obligation).filter(
        Obligation.obligation_id == data.obligation_id
    ).first()
    if not obligation:
        raise HTTPException(404, "Obligation not found.")

    # Available here means the part of the obligation that has not yet been paid out
    total_disbursed = _disbursed_total(db, data.obligation_id)
    available       = Decimal(str(obligation.obligation_amount)) - total_disbursed

    if data.disbursement_amount > available:
        raise HTTPException(
            400,
            f"Disbursement exceeds unpaid obligation balance. "
            f"Obligated: {obligation.obligation_amount:,.2f} | "
            f"Already disbursed: {total_disbursed:,.2f} | "
            f"Available: {available:,.2f} | "
            f"Requested: {data.disbursement_amount:,.2f}.",
        )

    disbursement = Disbursement(
        obligation_id       = data.obligation_id,
        payment_method      = data.payment_method,
        reference_number    = data.reference_number,
        disbursement_amount = data.disbursement_amount,
        disbursement_date   = data.disbursement_date,
        remarks             = data.remarks,
        created_by          = current_user.user_id,
    )
    db.add(disbursement)
    db.commit()
    db.refresh(disbursement)
    log_activity(
        db,
        "Create",
        "Disbursement",
        disbursement.disbursement_id,
        f"Recorded disbursement {disbursement.reference_number or disbursement.payment_method}.",
        current_user.user_id,
    )
    return DisbursementResponse.model_validate(disbursement)


def get_disbursements(
    db: Session, obligation_id: Optional[UUID] = None
) -> List[DisbursementResponse]:
    """
    This gets the disbursements data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(Disbursement)
    if obligation_id:
        q = q.filter(Disbursement.obligation_id == obligation_id)
    return [DisbursementResponse.model_validate(r) for r in q.order_by(Disbursement.disbursement_date).all()]


def get_disbursement(db: Session, disbursement_id: UUID) -> DisbursementResponse:
    """
    This gets the disbursement data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    return DisbursementResponse.model_validate(_get_or_404(db, disbursement_id))


def update_disbursement(
    db: Session, disbursement_id: UUID, data: DisbursementUpdate
) -> DisbursementResponse:
    """
    This updates the disbursement record with the values that were sent
    It loads the current row, applies only the provided changes, and returns the updated result
    """
    disbursement = _get_or_404(db, disbursement_id)

    if data.disbursement_amount is not None:
        # The update uses the remaining unpaid balance after removing the current row from the running total
        obligation     = db.query(Obligation).filter(
            Obligation.obligation_id == disbursement.obligation_id
        ).first()
        other_disbursed = _disbursed_total(
            db, disbursement.obligation_id, exclude_id=disbursement_id
        )
        available = Decimal(str(obligation.obligation_amount)) - other_disbursed

        if data.disbursement_amount > available:
            raise HTTPException(
                400,
                f"Revised amount {data.disbursement_amount:,.2f} exceeds "
                f"remaining obligation balance ({available:,.2f}).",
            )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(disbursement, field, value)

    db.commit()
    db.refresh(disbursement)
    return DisbursementResponse.model_validate(disbursement)


def delete_disbursement(db: Session, disbursement_id: UUID) -> dict:
    """
    This deletes the disbursement row after loading it first
    There is no lower child record here, so this one can be removed directly
    """
    disbursement = _get_or_404(db, disbursement_id)
    db.delete(disbursement)
    db.commit()
    return {"detail": "Disbursement deleted."}