from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class Program(Base):
    __tablename__ = "programs"

    program_id = Column(Integer, primary_key=True, autoincrement=True)
    office_id = Column(Integer, ForeignKey("offices.office_id"), nullable=False)

    program_code = Column(String(50))
    program_name = Column(String(255), nullable=False)
    description = Column(Text)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    office = relationship("Office", back_populates="programs")
    projects = relationship("Project", back_populates="program")