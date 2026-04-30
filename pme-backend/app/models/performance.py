from sqlalchemy import Column, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class Performance(Base):
    __tablename__ = "performance"

    performance_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    performance_indicator = Column(Text)
    target_total = Column(Integer)

    target_q1 = Column(Integer)
    target_q2 = Column(Integer)
    target_q3 = Column(Integer)
    target_q4 = Column(Integer)

    actual_q1 = Column(Integer)
    actual_q2 = Column(Integer)
    actual_q3 = Column(Integer)
    actual_q4 = Column(Integer)

    remarks = Column(Text)

    project_aips = relationship("ProjectAIP", back_populates="performance",foreign_keys="ProjectAIP.performance_id")