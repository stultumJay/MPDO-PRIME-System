from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from sqlalchemy.orm import relationship
from .base import Base

class ProjectAIP(Base):
    __tablename__ = "project_aip"

    project_aip_id = Column(Integer, primary_key=True, autoincrement=True)

    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    fiscal_year = Column(Integer, nullable=False)

    aip_reference_code = Column(String(100))

    sector_id = Column(Integer, ForeignKey("sectors.sector_id"))
    sub_sector_id = Column(Integer, ForeignKey("sub_sectors.sub_sector_id"))
    office_id = Column(Integer, ForeignKey("offices.office_id"))

    lgu_level = Column(String(50))
    fund_source_id = Column(Integer, ForeignKey("fund_sources.fund_source_id"))

    budget_ps = Column(Integer, default=0)
    budget_mooe = Column(Integer, default=0)
    budget_fe = Column(Integer, default=0)
    budget_co = Column(Integer, default=0)

    start_date = Column(DateTime)
    end_date = Column(DateTime)

    is_continuing = Column(Boolean, default=False)
    is_supplemental = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.user_id"))

    __table_args__ = (
        UniqueConstraint("project_id", "fiscal_year", name="uix_project_year"),
    )

    project = relationship("Project", back_populates="project_aips")
    office = relationship("Office", back_populates="project_aips")
    fund_source = relationship("FundSource", back_populates="project_aips")

    appropriations = relationship("Appropriation", back_populates="project_aip")