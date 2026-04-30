from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class SectorMini(BaseModel):
    sector_id:   UUID
    sector_name: str
    class Config:
        from_attributes = True
        
class ProgramMini(BaseModel):
    program_id:   UUID
    program_code: str
    program_name: str
    class Config:
        from_attributes = True
        
class OfficeMini(BaseModel):
    office_id:   UUID
    office_code: str
    office_name: str
    class Config:
        from_attributes = True
        
class ProjectBase(BaseModel):
    program_id:          UUID
    sector_id:           UUID
    office_id:           UUID
    project_title:       str
    project_description: Optional[str] = None
    barangay:            Optional[str] = None
    street:              Optional[str] = None
    location_lat:        Optional[float] = None
    location_lng:        Optional[float] = None
    expected_start_date: Optional[date] = None
    expected_end_date:   Optional[date] = None
    locational_clearance_status: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_title:       Optional[str]   = None
    project_description: Optional[str]   = None
    sector_id:           Optional[UUID]  = None
    barangay:            Optional[str]   = None
    street:              Optional[str]   = None
    location_lat:        Optional[float] = None
    location_lng:        Optional[float] = None
    expected_start_date: Optional[date]  = None
    expected_end_date:   Optional[date]  = None
    actual_start_date:   Optional[date]  = None
    actual_end_date:     Optional[date]  = None
    status:              Optional[str]   = None
    is_integrated:       Optional[bool]  = None
    locational_clearance_status: Optional[bool] = None


class ProjectOut(ProjectBase):
    project_id:          UUID
    project_code:        str
    fiscal_year:         int
    project_title:       str
    project_description: Optional[str]
    barangay:            Optional[str]
    street:              Optional[str]
    location_lat:        Optional[float]
    location_lng:        Optional[float]
    status:              str
    expected_start_date: Optional[date]
    expected_end_date:   Optional[date]
    actual_start_date:   Optional[date]
    actual_end_date:     Optional[date]
    is_integrated:       bool
    locational_clearance_status: bool
    locational_clearance_reference_no: Optional[str]
    locational_clearance_checked_at: Optional[datetime]
    is_active:           bool
    created_at:          datetime
    program:             Optional[ProgramMini]
    sector:              Optional[SectorMini]
    office:              Optional[OfficeMini]

    class Config:
        from_attributes = True
