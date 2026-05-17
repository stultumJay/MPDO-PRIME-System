from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class OfficeCreate(BaseModel):
    office_code: str                        # "01" … "20"
    office_type: int                        # 1 = mandatory | 2 = optional
    office_name: str
    mandate:                Optional[str] = None
    vision:                 Optional[str] = None
    mission:                Optional[str] = None
    organizational_outcome: Optional[str] = None

    @field_validator("office_code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip().zfill(2)
        if not v.isdigit() or not (1 <= int(v) <= 20):
            raise ValueError("office_code must be a numeric string between '01' and '20'.")
        return v

    @field_validator("office_type")
    @classmethod
    def validate_type(cls, v: int) -> int:
        if v not in (1, 2):
            raise ValueError("office_type must be 1 (mandatory) or 2 (optional).")
        return v


class OfficeUpdate(BaseModel):
    office_name:            Optional[str]  = None
    mandate:                Optional[str]  = None
    vision:                 Optional[str]  = None
    mission:                Optional[str]  = None
    organizational_outcome: Optional[str]  = None
    # office_code and office_type are immutable after creation


class OfficeResponse(BaseModel):
    office_id:              UUID
    office_code:            str
    office_type:            int
    office_name:            str
    mandate:                Optional[str]
    vision:                 Optional[str]
    mission:                Optional[str]
    organizational_outcome: Optional[str]

    class Config:
        from_attributes = True