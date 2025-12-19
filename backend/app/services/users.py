import uuid

import json
import logging
import uuid

from fastapi import HTTPException, status

from app.core.security import create_password_hash
from app.models import User, UserRole, AuditLog
from app.repositories import UserRepository, AuditLogRepository

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, users: UserRepository, audit_logs: AuditLogRepository):
        self.users = users
        self.audit_logs = audit_logs

    def list_users(self) -> list[User]:
        return self.users.list()

    def create_user(self, *, name: str, email: str, role: UserRole, password: str) -> User:
        if self.users.find_by_email(email):
            logger.warning("Attempt to create user with existing email=%s", email)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        user = User(
            name=name,
            email=email,
            role=role,
            hashed_password=create_password_hash(password),
        )
        self.users.add(user)
        self.users.flush()
        logger.info("User created id=%s", user.id)
        self._log_action(user.id, "create", {"email": email, "role": role})
        return user

    def update_user(
        self,
        user_id: uuid.UUID,
        *,
        name: str | None = None,
        email: str | None = None,
        role: UserRole | None = None,
        password: str | None = None,
        disabled: bool | None = None,
    ) -> User:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if email and email != user.email:
            if self.users.find_by_email(email):
                logger.warning("Attempt to update user to existing email=%s", email)
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
            user.email = email
        if name:
            user.name = name
        if role:
            user.role = role
        if disabled is not None:
            user.disabled = disabled
        if password:
            user.hashed_password = create_password_hash(password)
        self.users.flush()
        logger.info("User updated id=%s", user.id)
        self._log_action(
            user.id,
            "update",
            {
                "name": user.name,
                "email": user.email,
                "role": str(user.role),
                "disabled": user.disabled,
                "password_changed": bool(password),
            },
        )
        return user

    def update_role_status(
        self,
        user_id: uuid.UUID,
        *,
        role: UserRole | None = None,
        disabled: bool | None = None,
    ) -> User:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        changes = {}
        if role and role != user.role:
            user.role = role
            changes["role"] = str(role)
        if disabled is not None:
            user.disabled = disabled
            changes["disabled"] = disabled
        self.users.flush()
        if changes:
            self._log_action(user.id, "role_update", changes)
            logger.info("User role/status updated id=%s changes=%s", user.id, changes)
        return user

    def _log_action(self, entity_id: uuid.UUID, action: str, payload: dict):
        log = AuditLog(entity_type="user", entity_id=entity_id, action=action, payload=json.dumps(payload))
        self.audit_logs.add(log)

    def delete_user(self, user_id: uuid.UUID) -> None:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        self.users.delete(user)
        self.users.flush()
        logger.info("User deleted id=%s", user_id)
        self._log_action(user_id, "delete", {"email": user.email})
