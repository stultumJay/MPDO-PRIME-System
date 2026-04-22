from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role_id: int


class UserUpdate(BaseModel):
    full_name: Optional[str]
    role_id: Optional[int]
    is_active: Optional[bool]


class ChangePassword(BaseModel):
    old_password: str
    new_password: str
    
class AdminChangePassword(BaseModel):
    new_password: str

class UserOut(BaseModel):
    user_id: UUID
    full_name: str
    email: EmailStr
    role_id: int
    is_active: bool

    class Config:
        from_attributes = True