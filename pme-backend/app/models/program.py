from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class Program(Base):
    __tablename__ = "program"

    program_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sector_id = Column(UUID(as_uuid=True), ForeignKey("sector.sector_id"))

    program_code = Column(String(10), nullable=False)
    program_name = Column(String(150), nullable=False)
    description = Column(Text)
    
    is_active  = Column(Boolean,  nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("sector_id", "program_code", name="uq_program_sector_code"),
    )

    sector = relationship("Sector", back_populates="programs")
    projects = relationship("Project", back_populates="program")