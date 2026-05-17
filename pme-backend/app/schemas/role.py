from pydantic import BaseModel
from uuid import UUID

class RoleBase(BaseModel):
    role_name: str


class RoleOut(RoleBase):
    role_id: UUID

    class Config:
        from_attributes = True