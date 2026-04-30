from sqlalchemy import Column, ForeignKey, String, Text, SmallInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class Office(Base):
    __tablename__ = "office"

    office_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)    
    
    office_code = Column(String(2), nullable=False)
    office_type = Column(SmallInteger, nullable=False)
    office_name = Column(String(150), nullable=False)

    mandate = Column(Text)
    vision = Column(Text)
    mission = Column(Text)
    organizational_outcome = Column(Text)
    
    __table_args__ = (
        UniqueConstraint("office_type", "office_code", name="uq_office_type_code"),
    )
    
    projects = relationship("Project", back_populates="office")
