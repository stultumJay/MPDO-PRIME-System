from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectAIPBase(BaseModel):
    project_id: int
    fiscal_year: int

    aip_reference_code: Optional[str]

    sector_id: Optional[int]
    sub_sector_id: Optional[int]
    office_id: Optional[int]

    lgu_level: int = 3
    fund_source_id: Optional[int]

    budget_ps: int = 0
    budget_mooe: int = 0
    budget_fe: int = 0
    budget_co: int = 0

    start_date: Optional[datetime]
    end_date: Optional[datetime]

    is_continuing: bool = False
    is_supplemental: bool = False


class ProjectAIPCreate(ProjectAIPBase):
    created_by: int


class ProjectAIPUpdate(BaseModel):
    aip_reference_code: Optional[str]
    sector_id: Optional[int]
    sub_sector_id: Optional[int]
    office_id: Optional[int]
    fund_source_id: Optional[int]


class ProjectAIPOut(ProjectAIPBase):
    project_aip_id: int
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True