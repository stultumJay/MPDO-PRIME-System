from datetime import date, datetime, time
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import UserAccount
from app.schemas.audit import AuditResponse


def log_activity(
    db:          Session,
    action:      str,
    entity:      str,
    entity_id:   Optional[str] = None,
    description: Optional[str] = None,
    performed_by: Optional[UUID] = None,
) -> None:
    """
    Write a single audit entry.  Called by other services on every
    create / update / delete / resolve action.
    """
    log = AuditLog(
        action       = action,
        entity       = entity,
        entity_id    = str(entity_id) if entity_id else None,
        description  = description,
        performed_by = performed_by,
    )
    db.add(log)
    db.commit()


def _to_audit_response(db: Session, row: AuditLog) -> AuditResponse:
    user_name = None
    if row.performed_by:
        user_name = (
            db.query(UserAccount.full_name)
            .filter(UserAccount.user_id == row.performed_by)
            .scalar()
        )

    return AuditResponse(
        audit_id=row.audit_id,
        action=row.action,
        entity=row.entity,
        entity_id=row.entity_id,
        description=row.description,
        performed_by=row.performed_by,
        performed_by_name=user_name,
        created_at=row.created_at,
    )


def get_recent_activities(
    db: Session,
    limit: int = 5,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[AuditResponse]:
    """
    This gets the recent activities data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(AuditLog)
    if start_date:
        q = q.filter(AuditLog.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        q = q.filter(AuditLog.created_at <= datetime.combine(end_date, time.max))

    rows = q.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [_to_audit_response(db, r) for r in rows]


def get_all_activities(
    db:     Session,
    skip:   int = 0,
    limit:  int = 20,
    entity: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[AuditResponse]:
    """
    This gets the all activities data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    q = db.query(AuditLog)
    if entity:
        q = q.filter(AuditLog.entity == entity)
    if action:
        q = q.filter(AuditLog.action == action)
    if start_date:
        q = q.filter(AuditLog.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        q = q.filter(AuditLog.created_at <= datetime.combine(end_date, time.max))
    rows = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_audit_response(db, r) for r in rows]
