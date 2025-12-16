import os
import sys
import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.api.dependencies import get_current_user, get_db_session
from app.core import database as db_module
from app.core.config import get_settings
from app.core.security import create_password_hash
from app.core.timezone import ensure_ist, now_ist
from app.main import create_app
from app.models import (
    Base,
    Investor,
    InvestmentActivity,
    InvestmentActivityType,
    Transaction,
    TransactionType,
    QuantityType,
    ExpenseCategory,
    User,
    UserRole,
)
from app.services.auth import AuthService

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
get_settings.cache_clear()

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
db_module._engine = engine
db_module._SessionFactory = TestingSessionLocal


@event.listens_for(engine, "connect")
def _register_sqlite_functions(dbapi_connection, _):
    from datetime import timedelta

    def date_trunc(unit: str, value):
        if value is None:
            return None
        if isinstance(value, str):
            dt = datetime.fromisoformat(value)
        else:
            dt = value
        unit = unit.lower()
        if unit == "day":
            truncated = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        elif unit == "week":
            start = dt - timedelta(days=dt.weekday())
            truncated = start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif unit == "month":
            truncated = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            truncated = dt
        return truncated.isoformat()

    dbapi_connection.create_function("date_trunc", 2, date_trunc)


@event.listens_for(TestingSessionLocal, "before_flush")
def _apply_sqlite_defaults(session: Session, *_):
    now = now_ist()
    for obj in session.new:
        if hasattr(obj, "id") and getattr(obj, "id", None) is None:
            setattr(obj, "id", uuid.uuid4())
        if hasattr(obj, "created_at") and getattr(obj, "created_at", None) is None:
            setattr(obj, "created_at", now)
        if hasattr(obj, "updated_at") and getattr(obj, "updated_at", None) is None:
            setattr(obj, "updated_at", now)
        if hasattr(obj, "occurred_at") and getattr(obj, "occurred_at", None) is None:
            setattr(obj, "occurred_at", now)
        if hasattr(obj, "last_activity_at") and getattr(obj, "last_activity_at", None) is None:
            setattr(obj, "last_activity_at", now)
        if hasattr(obj, "total_invested") and getattr(obj, "total_invested", None) is None:
            setattr(obj, "total_invested", Decimal("0"))
        if hasattr(obj, "total_withdrawn") and getattr(obj, "total_withdrawn", None) is None:
            setattr(obj, "total_withdrawn", Decimal("0"))
        if hasattr(obj, "net_investment") and getattr(obj, "net_investment", None) is None:
            setattr(obj, "net_investment", Decimal("0"))


@pytest.fixture(autouse=True)
def reset_auth_service_state():
    AuthService.revoked_refresh_tokens.clear()
    yield


@pytest.fixture()
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def app_with_overrides(db_session):
    app = create_app()

    def override_db_session():
        try:
            yield db_session
        except Exception:
            db_session.rollback()
            raise
        else:
            db_session.commit()

    app.dependency_overrides[get_db_session] = override_db_session
    return app


@pytest.fixture()
def client(app_with_overrides):
    with TestClient(app_with_overrides) as test_client:
        yield test_client


@pytest.fixture()
def current_user_override(app_with_overrides) -> Callable[[User], None]:
    def _override(user: User):
        app_with_overrides.dependency_overrides[get_current_user] = lambda: user

    return _override


@pytest.fixture()
def user_factory(db_session):
    def _factory(
        *,
        role: UserRole = UserRole.admin,
        email: str | None = None,
        name: str | None = None,
        password: str = "password123",
        disabled: bool = False,
    ) -> User:
        user = User(
            name=name or f"{role.value.title()} {uuid.uuid4().hex[:6]}",
            email=email or f"{uuid.uuid4().hex}@example.com",
            role=role,
            hashed_password=create_password_hash(password),
            disabled=disabled,
        )
        db_session.add(user)
        db_session.flush()
        return user

    return _factory


@pytest.fixture()
def admin_user(user_factory) -> User:
    return user_factory(role=UserRole.admin, email="admin@example.com", name="Admin User")


@pytest.fixture()
def partner_user(user_factory) -> User:
    return user_factory(role=UserRole.partner, email="partner@example.com", name="Partner User")


@pytest.fixture()
def staff_user(user_factory) -> User:
    return user_factory(role=UserRole.staff, email="staff@example.com", name="Staff User")


@pytest.fixture()
def authorized_client(app_with_overrides, admin_user, current_user_override):
    current_user_override(admin_user)
    with TestClient(app_with_overrides) as test_client:
        yield test_client


@pytest.fixture()
def transaction_factory(db_session, admin_user):
    def _factory(
        *,
        type_: TransactionType = TransactionType.buy,
        product_name: str | None = None,
        total_amount: Decimal = Decimal("1000"),
        quantity: float = 1,
        occurred_at: datetime | None = None,
        recorded_by_id=None,
        expense_category: ExpenseCategory | None = None,
        notes: str | None = "note",
    ) -> Transaction:
        normalized_at = ensure_ist(occurred_at or now_ist())
        data: dict = {
            "type": type_,
            "total_amount": total_amount,
            "occurred_at": normalized_at,
            "person_name": "Recorded User",
            "recorded_by_id": recorded_by_id or admin_user.id,
            "notes": notes,
        }
        if type_ == TransactionType.expense:
            data["expense_category"] = expense_category or ExpenseCategory.other
            data["expense_description"] = "Expense"
        else:
            data["product_name"] = product_name or "Sample Product"
            data["quantity"] = quantity
            data["quantity_type"] = QuantityType.unit
            data["price_per_unit"] = Decimal("100")
        transaction = Transaction(**data)
        db_session.add(transaction)
        db_session.flush()
        return transaction

    return _factory


@pytest.fixture()
def investor_factory(db_session):
    def _factory(
        *,
        name: str | None = None,
        invested: Decimal = Decimal("0"),
        withdrawn: Decimal = Decimal("0"),
        net: Decimal | None = None,
    ) -> Investor:
        investor = Investor(
            name=name or f"Investor {uuid.uuid4().hex[:6]}",
            total_invested=invested,
            total_withdrawn=withdrawn,
            net_investment=net if net is not None else invested - withdrawn,
            last_activity_at=now_ist(),
        )
        db_session.add(investor)
        db_session.flush()
        return investor

    return _factory


@pytest.fixture()
def investment_activity_factory(db_session):
    def _factory(
        *,
        investor_id,
        activity_type: InvestmentActivityType = InvestmentActivityType.investment,
        amount: Decimal = Decimal("1000"),
    ) -> InvestmentActivity:
        activity = InvestmentActivity(
            investor_id=investor_id,
            type=activity_type,
            amount=amount,
            notes="note",
            occurred_at=now_ist(),
        )
        db_session.add(activity)
        db_session.flush()
        return activity

    return _factory
