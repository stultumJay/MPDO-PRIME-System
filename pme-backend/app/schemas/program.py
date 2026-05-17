from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from uuid import UUID


class ProgramBase(BaseModel):
    sector_id: UUID
    program_name: str
    description: Optional[str]
    is_active: bool = True


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    program_name: Optional[str]
    description: Optional[str]
    is_active: Optional[bool]


class ProgramResponse(BaseModel):
    program_id:   UUID
    sector_id:    UUID
    program_code: str
    program_name: str
    description:  Optional[str]
    is_active:    bool
    created_at:   datetime

    class Config:
        from_attributes = True