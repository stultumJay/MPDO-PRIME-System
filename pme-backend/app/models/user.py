from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class UserAccount(Base):
    __tablename__ = "user_account"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = Column(String(150))
    username = Column(String(100), unique=True)
    password_hash = Column(String)

    email = Column(String(150))

    role_id = Column(UUID(as_uuid=True), ForeignKey("role.role_id"))

    is_active = Column(Boolean, default=True)

    role = relationship("Role", back_populates="users")
