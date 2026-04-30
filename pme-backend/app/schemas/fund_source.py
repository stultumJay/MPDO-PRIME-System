from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FundSourceBase(BaseModel):
    fund_category: Optional[str]
    fund_name: Optional[str]
    description: Optional[str]


class FundSourceCreate(FundSourceBase):
    pass


class FundSourceOut(FundSourceBase):
    fund_source_id: int
    created_at: datetime

    class Config:
        from_attributes = True