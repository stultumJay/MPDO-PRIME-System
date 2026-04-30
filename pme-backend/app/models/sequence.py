from sqlalchemy import Column, Integer, UniqueConstraint
from .base import Base
from sqlalchemy.dialects.postgresql import UUID

class ProjectSequence(Base):
    """
    One row per fiscal year.  last_value is the highest project
    sequence number issued for that year.
    Lock with .with_for_update() before incrementing.
    """
    __tablename__ = "project_sequence"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(Integer, nullable=False)
    last_value  = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("fiscal_year", name="uq_project_seq_year"),
    )


class AipSequence(Base):
    """
    One row per fiscal year and program counter bucket

    The column is still named sector_id because the first version counted by sector
    The AIP code helper now stores program_id here so project numbers reset per program
    """
    __tablename__ = "aip_sequence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(Integer, nullable=False)
    sector_id = Column(UUID(as_uuid=True), nullable=False)

    last_value = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("fiscal_year", "sector_id", name="uq_aip_seq_sector_year"),
    )