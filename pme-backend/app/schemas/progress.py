from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

_Z = Decimal("0.00")


class ProgressCreate(BaseModel):
    project_id:  UUID
    phase_id:    UUID
    new_percent: Decimal
    remarks:     Optional[str] = None

    @field_validator("new_percent")
    @classmethod
    def valid_range(cls, v: Decimal) -> Decimal:
        if v < _Z or v > Decimal("100"):
            raise ValueError("new_percent must be between 0 and 100.")
        return v


class ProgressUpdate(BaseModel):
    """
    Only remarks can be freely updated.
    new_percent follows forward-only logic enforced in the service.
    """
    new_percent: Optional[Decimal] = None
    remarks:     Optional[str]    = None

    @field_validator("new_percent")
    @classmethod
    def valid_range(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and (v < _Z or v > Decimal("100")):
            raise ValueError("new_percent must be between 0 and 100.")
        return v


class ProgressResponse(BaseModel):
    progress_id:      UUID
    project_id:       UUID
    phase_id:         UUID
    previous_percent: Optional[Decimal]
    new_percent:      Optional[Decimal]
    remarks:          Optional[str]
    logged_at:        datetime

    class Config:
        from_attributes = True


class PhaseProgressSummary(BaseModel):
    phase_id:              UUID
    phase_name:            str
    weight_percent:        Decimal
    current_percent:       Decimal
    weighted_contribution: Decimal


class ProjectProgressSummary(BaseModel):
    project_id:         UUID
    project_code:       str
    overall_completion: Decimal
    phases:             List[PhaseProgressSummary]