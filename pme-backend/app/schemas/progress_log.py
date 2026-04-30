from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class PhaseEnum(str, Enum):
    planning = "planning"
    procurement = "procurement"
    construction = "construction"
    testing = "testing"


class StatusEnum(str, Enum):
    on_track = "on_track"
    delayed = "delayed"



class ProgressLogBase(BaseModel):
    project_id: int

    phase: PhaseEnum
    progress_percent: int = Field(..., ge=0, le=100)

    status: StatusEnum
    delay_days: Optional[int] = 0

    report_date: Optional[datetime]
    actual_date: Optional[datetime]

    remarks: Optional[str] = None



class ProgressLogCreate(ProgressLogBase):
    created_by: int


class ProgressLogUpdate(BaseModel):
    phase: Optional[PhaseEnum]
    progress_percent: Optional[int] = Field(None, ge=0, le=100)

    status: Optional[StatusEnum]
    delay_days: Optional[int]

    report_date: Optional[datetime]
    actual_date: Optional[datetime]

    remarks: Optional[str]


class ProgressLogResponse(ProgressLogBase):
    progress_id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressLogListResponse(BaseModel):
    data: List[ProgressLogResponse]
    total: int

    class Config:
        from_attributes = True