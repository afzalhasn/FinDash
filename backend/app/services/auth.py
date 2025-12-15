import logging
import uuid

from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    TokenPair,
)
from app.models import User
from app.repositories import UserRepository

logger = logging.getLogger(__name__)


class AuthService:
    revoked_refresh_tokens: set[str] = set()

    def __init__(self, settings: Settings, users: UserRepository):
        self.settings = settings
        self.users = users

    def authenticate(self, email: str, password: str) -> tuple[User, TokenPair]:
        user = self.users.find_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            logger.warning("Authentication failed for email=%s", email)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if user.disabled:
            logger.warning("Disabled user attempted login id=%s", user.id)
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

        logger.info("User authenticated id=%s", user.id)
        return user, self._issue_tokens(user)

    def refresh(self, refresh_token: str) -> tuple[User, TokenPair]:
        if refresh_token in self.revoked_refresh_tokens:
            logger.warning("Revoked refresh token attempted use")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

        subject = decode_token(refresh_token, self.settings, refresh=True)
        try:
            user_id = uuid.UUID(subject)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        logger.info("Refresh token issued for user id=%s", user.id)
        return user, self._issue_tokens(user)

    def revoke_refresh_token(self, refresh_token: str) -> None:
        self.revoked_refresh_tokens.add(refresh_token)
        logger.info("Refresh token revoked")

    def _issue_tokens(self, user: User) -> TokenPair:
        access = create_access_token(subject=str(user.id), settings=self.settings)
        refresh = create_refresh_token(subject=str(user.id), settings=self.settings)
        return TokenPair(access_token=access, refresh_token=refresh)
