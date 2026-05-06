from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

_Z = Decimal("0.00")


class PhaseConfigCreate(BaseModel):
    phase_name:     str
    weight_percent: Decimal

    @field_validator("weight_percent")
    @classmethod
    def positive_weight(cls, v: Decimal) -> Decimal:
        if v <= _Z or v > Decimal("100"):
            raise ValueError("weight_percent must be between 0.01 and 100.")
        return v


class PhaseConfigUpdate(BaseModel):
    phase_name:     Optional[str]     = None
    weight_percent: Optional[Decimal] = None

    @field_validator("weight_percent")
    @classmethod
    def positive_weight(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and (v <= _Z or v > Decimal("100")):
            raise ValueError("weight_percent must be between 0.01 and 100.")
        return v


class PhaseConfigResponse(BaseModel):
    phase_id:       UUID
    phase_name:     str
    weight_percent: Optional[Decimal]
    class Config:
        from_attributes = True


class PhaseWeightSummary(BaseModel):
    """Used to warn when total weights do not sum to 100."""
    total_weight:   Decimal
    is_balanced:    bool            # True when total == 100
    active_phases:  int