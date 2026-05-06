from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
 
 
class AuditResponse(BaseModel):
    audit_id:     UUID
    action:       str
    entity:       str
    entity_id:    Optional[str]
    description:  Optional[str]
    performed_by: Optional[UUID]
    performed_by_name: Optional[str] = None
    created_at:   datetime
 
    class Config:
        from_attributes = True