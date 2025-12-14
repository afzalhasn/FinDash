import uuid

import json
import uuid

from fastapi import HTTPException, status

from app.core.security import create_password_hash
from app.models import User, UserRole, AuditLog
from app.repositories import UserRepository, AuditLogRepository


class UserService:
    def __init__(self, users: UserRepository, audit_logs: AuditLogRepository):
        self.users = users
        self.audit_logs = audit_logs

    def list_users(self) -> list[User]:
        return self.users.list()

    def create_user(self, *, name: str, email: str, role: UserRole, password: str) -> User:
        if self.users.find_by_email(email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        user = User(
            name=name,
            email=email,
            role=role,
            hashed_password=create_password_hash(password),
        )
        self.users.add(user)
        self.users.flush()
        self._log_action(user.id, "create", {"email": email, "role": role})
        return user

    def update_user(self, user_id: uuid.UUID, *, name: str | None = None, email: str | None = None) -> User:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if email and email != user.email:
            if self.users.find_by_email(email):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
            user.email = email
        if name:
            user.name = name
        self.users.flush()
        self._log_action(user.id, "update", {"name": user.name, "email": user.email})
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
        return user

    def _log_action(self, entity_id: uuid.UUID, action: str, payload: dict):
        log = AuditLog(entity_type="user", entity_id=entity_id, action=action, payload=json.dumps(payload))
        self.audit_logs.add(log)
