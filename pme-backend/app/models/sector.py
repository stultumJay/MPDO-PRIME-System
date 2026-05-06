from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class Sector(Base):
    __tablename__ = "sector"

    sector_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sector_code = Column(String(10), nullable=False)
    sector_name = Column(String(100), nullable=False)

    projects = relationship("Project", back_populates="sector")
    programs = relationship("Program", back_populates="sector")