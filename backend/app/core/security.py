import base64
import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass

from .config import Settings


@dataclass
class TokenPayload:
    sub: str
    exp: int


def _hash_password(password: str, salt: str) -> str:
    """Hash helper using PBKDF2-HMAC for portability."""
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        390_000,
    )
    return base64.b64encode(dk).decode("utf-8")


def create_password_hash(password: str) -> str:
    """Return salted password hash string: salt$hash."""
    salt = secrets.token_hex(16)
    return f"{salt}${_hash_password(password, salt)}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password using stored salt."""
    try:
        salt, hashed = stored_hash.split("$", 1)
    except ValueError:
        return False
    candidate = _hash_password(password, salt)
    return hmac.compare_digest(candidate, hashed)


def create_access_token(subject: str, settings: Settings, expires_minutes: int | None = None) -> str:
    """Create a symmetric token signed with HMAC (placeholder until JWT is wired)."""
    expiry = int(time.time()) + 60 * (expires_minutes or settings.access_token_expire_minutes)
    payload = f"{subject}:{expiry}"
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    token = f"{payload}:{base64.urlsafe_b64encode(signature).decode('utf-8')}"
    return base64.urlsafe_b64encode(token.encode("utf-8")).decode("utf-8")


def decode_access_token(token: str, settings: Settings) -> TokenPayload | None:
    """Validate token signature and expiration."""
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        subject, expiry_str, sig = decoded.split(":")
    except Exception:
        return None

    expected_sig = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        f"{subject}:{expiry_str}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    if not hmac.compare_digest(base64.urlsafe_b64encode(expected_sig).decode("utf-8"), sig):
        return None

    expiry = int(expiry_str)
    if expiry < int(time.time()):
        return None

    return TokenPayload(sub=subject, exp=expiry)
