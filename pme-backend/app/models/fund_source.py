from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .base import Base

class FundSource(Base):
    __tablename__ = "fund_sources"

    fund_source_id = Column(Integer, primary_key=True, autoincrement=True)

    fund_category = Column(String(50))
    fund_name = Column(String(100))
    description = Column(Text)