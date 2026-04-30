from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.schemas.role import RoleOut


class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role_id: Optional[UUID] = None
    role_name: Optional[str] = None

    @model_validator(mode="after")
    def validate_role_selection(self):
        if not self.role_id and not self.role_name:
            raise ValueError("Either role_id or role_name must be provided.")
        return self


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[UUID] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class AdminChangePassword(BaseModel):
    new_password: str


class UserOut(BaseModel):
    user_id: UUID
    full_name: str
    username: str
    email: EmailStr
    role_id: Optional[UUID] = None
    role: Optional[RoleOut] = None
    is_active: bool

    class Config:
        from_attributes = True