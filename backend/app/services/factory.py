from sqlalchemy.orm import Session

from app.core.config import get_settings, Settings
from app.repositories import (
    UserRepository,
    TransactionRepository,
    InvestorRepository,
    InvestmentActivityRepository,
    AuditLogRepository,
)
from .auth import AuthService
from .transactions import TransactionService
from .investors import InvestorService
from .insights import InsightService
from .users import UserService


class ServiceFactory:
    def __init__(self, session: Session, settings: Settings | None = None):
        self.session = session
        self.settings = settings or get_settings()

    def auth_service(self) -> AuthService:
        return AuthService(settings=self.settings, users=UserRepository(self.session))

    def transaction_service(self) -> TransactionService:
        return TransactionService(transactions=TransactionRepository(self.session))

    def investor_service(self) -> InvestorService:
        return InvestorService(
            investors=InvestorRepository(self.session),
            activities=InvestmentActivityRepository(self.session),
        )

    def insight_service(self) -> InsightService:
        return InsightService(session=self.session)

    def user_service(self) -> UserService:
        return UserService(
            users=UserRepository(self.session),
            audit_logs=AuditLogRepository(self.session),
        )
