import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text

from .base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    partner = "partner"
    staff = "staff"


class User(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(Text, nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.staff)
    disabled = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("timezone('utc', now())"),
        onupdate=datetime.utcnow,
    )
