import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_session_factory
from app.core.security import decode_token
from app.models import User
from app.repositories import UserRepository
from app.services import (
    ServiceFactory,
    AuthService,
    TransactionService,
    InvestorService,
    InsightService,
    UserService,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db_session():
    settings = get_settings()
    factory = get_session_factory(settings)
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_service_factory(session: Session = Depends(get_db_session)) -> ServiceFactory:
    return ServiceFactory(session=session)


def get_auth_service(factory: ServiceFactory = Depends(get_service_factory)) -> AuthService:
    return factory.auth_service()


def get_transaction_service(factory: ServiceFactory = Depends(get_service_factory)) -> TransactionService:
    return factory.transaction_service()


def get_investor_service(factory: ServiceFactory = Depends(get_service_factory)) -> InvestorService:
    return factory.investor_service()


def get_insight_service(factory: ServiceFactory = Depends(get_service_factory)) -> InsightService:
    return factory.insight_service()


def get_user_service(factory: ServiceFactory = Depends(get_service_factory)) -> UserService:
    return factory.user_service()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_db_session),
):
    settings = get_settings()
    subject = decode_token(token, settings)
    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.disabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
    return user


def require_roles(*roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency
