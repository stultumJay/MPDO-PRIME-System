from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator


class PerformanceCreate(BaseModel):
    performance_indicator: str
    target_total:          int
    target_q1:             int = 0
    target_q2:             int = 0
    target_q3:             int = 0
    target_q4:             int = 0
    remarks:               Optional[str] = None

    @model_validator(mode="after")
    def quarterly_sum_check(self) -> "PerformanceCreate":
        qs = self.target_q1 + self.target_q2 + self.target_q3 + self.target_q4
        if qs > self.target_total:
            raise ValueError(
                f"Quarterly targets sum to {qs} but target_total is {self.target_total}. "
                "Quarterly targets must not exceed the total target."
            )
        return self


class PerformanceUpdate(BaseModel):
    performance_indicator: Optional[str] = None
    target_total:          Optional[int] = None
    target_q1:             Optional[int] = None
    target_q2:             Optional[int] = None
    target_q3:             Optional[int] = None
    target_q4:             Optional[int] = None
    actual_q1:             Optional[int] = None
    actual_q2:             Optional[int] = None
    actual_q3:             Optional[int] = None
    actual_q4:             Optional[int] = None
    remarks:               Optional[str] = None

    @model_validator(mode="after")
    def quarterly_sum_check(self) -> "PerformanceUpdate":
        quarter_values = [self.target_q1, self.target_q2, self.target_q3, self.target_q4]
        if self.target_total is None or not any(value is not None for value in quarter_values):
            return self

        qs = sum(value or 0 for value in quarter_values)
        if qs > self.target_total:
            raise ValueError(
                f"Quarterly targets sum to {qs} but target_total is {self.target_total}. "
                "Quarterly targets must not exceed the total target."
            )
        return self


class PerformanceResponse(BaseModel):
    performance_id:        UUID
    performance_indicator: Optional[str]
    target_total:          Optional[int]
    target_q1:             Optional[int]
    target_q2:             Optional[int]
    target_q3:             Optional[int]
    target_q4:             Optional[int]
    actual_q1:             Optional[int]
    actual_q2:             Optional[int]
    actual_q3:             Optional[int]
    actual_q4:             Optional[int]
    remarks:               Optional[str]
    created_at:            Optional[datetime]
    updated_at:            Optional[datetime]
    class Config:
        from_attributes = True