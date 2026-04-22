from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = Column(String(255))
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))

    role_id = Column(Integer, ForeignKey("roles.role_id"))

    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")