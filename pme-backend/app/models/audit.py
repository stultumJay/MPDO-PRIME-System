from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base
 
 
class AuditLog(Base):
    __tablename__ = "audit_log"
 
    audit_id     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action       = Column(String(50),  nullable=False)   # CREATE | UPDATE | DELETE | LOGIN | RESOLVE
    entity       = Column(String(100), nullable=False)   # "project" | "aip" | "allotment" etc.
    entity_id    = Column(String(100), nullable=True)    # UUID or code of the affected record
    description  = Column(Text,        nullable=True)
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    created_at   = Column(DateTime, nullable=False, server_default=func.now())