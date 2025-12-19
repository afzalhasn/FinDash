from pydantic import BaseModel, EmailStr

from app.models import UserRole


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    password: str | None = None
    disabled: bool | None = None


class UserRoleUpdate(BaseModel):
    role: UserRole
    disabled: bool | None = None
