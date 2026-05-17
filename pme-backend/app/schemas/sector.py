from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class SectorCreate(BaseModel):
    sector_code: str
    sector_name: str

class SectorUpdate(BaseModel):
    sector_code: Optional[str] = None
    sector_name: Optional[str] = None

class SectorResponse(BaseModel):
    sector_id:   UUID
    sector_code: str
    sector_name: str

    class Config:
        from_attributes = True