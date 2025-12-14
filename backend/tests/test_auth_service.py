import uuid

import pytest
import fastapi
from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.security import create_password_hash
from app.models import User, UserRole
from app.services.auth import AuthService


class FakeUserRepo:
    def __init__(self):
        self.by_email = {}
        self.by_id = {}

    def find_by_email(self, email: str):
        return self.by_email.get(email)

    def get(self, user_id):
        # user_id might arrive as string
        if isinstance(user_id, uuid.UUID):
            return self.by_id.get(user_id)
        try:
            user_uuid = uuid.UUID(str(user_id))
        except ValueError:
            return None
        return self.by_id.get(user_uuid)

    def add_user(self, user: User):
        self.by_email[user.email] = user
        self.by_id[user.id] = user


def make_service():
    repo = FakeUserRepo()
    user = User(
        id=uuid.uuid4(),
        email="admin@findash.com",
        name="Admin",
        role=UserRole.admin,
        hashed_password=create_password_hash("password"),
        disabled=False,
    )
    repo.add_user(user)
    service = AuthService(settings=Settings(), users=repo)
    return service, user


def test_authenticate_success():
    service, user = make_service()
    result_user, tokens = service.authenticate("admin@findash.com", "password")
    assert result_user.id == user.id
    assert tokens.access_token
    assert tokens.refresh_token


def test_authenticate_bad_password():
    service, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        service.authenticate("admin@findash.com", "wrong")
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_requires_valid_token():
    service, user = make_service()
    _, tokens = service.authenticate("admin@findash.com", "password")
    refreshed_user, new_tokens = service.refresh(tokens.refresh_token)
    assert refreshed_user.id == user.id
    assert new_tokens.access_token != tokens.access_token
