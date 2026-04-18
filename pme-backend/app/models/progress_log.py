from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class ProgressLog(Base):
    __tablename__ = "progress_logs"

    progress_id = Column(Integer, primary_key=True, autoincrement=True)

    project_id = Column(Integer, ForeignKey("projects.project_id"))

    phase = Column(String(50))  # planning, procurement, construction, testing

    progress_percent = Column(Integer)  # 0–100
    status = Column(String(50))  # on_track | delayed

    delay_days = Column(Integer)

    report_date = Column(DateTime)
    actual_date = Column(DateTime)

    remarks = Column(String)

    created_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="progress_logs")