import os
import uuid
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.core import config, database
from app.core.timezone import IST_TIMEZONE
from app.main import create_app
from app.models import Base, Transaction, TransactionType, QuantityType, ExpenseCategory, UserRole


def _strip_server_defaults():
    for table in Base.metadata.sorted_tables:
        for column in table.columns:
            column.server_default = None


def _seed_transactions(session):
    base_entries = [
        # Purchases
        ("buy", "Laptop", Decimal("4000"), datetime(2024, 12, 9, tzinfo=IST_TIMEZONE)),
        ("buy", "Mouse", Decimal("300"), datetime(2024, 12, 11, tzinfo=IST_TIMEZONE)),
        ("buy", "Keyboard", Decimal("500"), datetime(2024, 12, 12, tzinfo=IST_TIMEZONE)),
        # Sales
        ("sell", "Laptop", Decimal("3600"), datetime(2024, 12, 10, tzinfo=IST_TIMEZONE)),
        ("sell", "Mouse", Decimal("375"), datetime(2024, 12, 12, 1, tzinfo=IST_TIMEZONE)),
        ("sell", "Keyboard", Decimal("640"), datetime(2024, 12, 13, tzinfo=IST_TIMEZONE)),
        ("sell", "Laptop", Decimal("2400"), datetime(2024, 12, 13, 8, tzinfo=IST_TIMEZONE)),
    ]

    for txn_type, product, total, occurred in base_entries:
        session.add(
            Transaction(
                id=uuid.uuid4(),
                type=TransactionType[txn_type],
                product_name=product,
                quantity=1,
                quantity_type=QuantityType.unit,
                total_amount=total,
                person_name="System",
                occurred_at=occurred,
                created_at=occurred,
                updated_at=occurred,
            )
        )

    expense_entries = [
        (ExpenseCategory.rent, Decimal("1500"), "Office rent", datetime(2024, 12, 1, tzinfo=IST_TIMEZONE)),
        (ExpenseCategory.transport, Decimal("200"), "Delivery", datetime(2024, 12, 12, tzinfo=IST_TIMEZONE)),
        (ExpenseCategory.salary, Decimal("2000"), "Salary", datetime(2024, 12, 13, tzinfo=IST_TIMEZONE)),
    ]
    for category, total, description, occurred in expense_entries:
        session.add(
            Transaction(
                id=uuid.uuid4(),
                type=TransactionType.expense,
                expense_category=category,
                expense_description=description,
                total_amount=total,
                person_name="System",
                occurred_at=occurred,
                created_at=occurred,
                updated_at=occurred,
            )
        )


@pytest.fixture()
def insights_client(tmp_path):
    original_db_url = os.environ.get("DATABASE_URL")
    db_path = tmp_path / "insights.db"
    os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{db_path}"

    config.get_settings.cache_clear()
    database._engine = None  # type: ignore[attr-defined]
    database._SessionFactory = None  # type: ignore[attr-defined]

    _strip_server_defaults()
    settings = config.get_settings()
    engine = database.get_engine(settings)
    Base.metadata.drop_all(bind=engine, checkfirst=True)
    Base.metadata.create_all(bind=engine)

    SessionFactory = database.get_session_factory(settings)
    session = SessionFactory()
    try:
        _seed_transactions(session)
        session.commit()
    finally:
        session.close()

    app = create_app()
    dummy_user = SimpleNamespace(id=uuid.uuid4(), role=UserRole.admin, disabled=False)
    app.dependency_overrides[get_current_user] = lambda: dummy_user

    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.clear()
        database._engine = None  # type: ignore[attr-defined]
        database._SessionFactory = None  # type: ignore[attr-defined]
        config.get_settings.cache_clear()
        if original_db_url is not None:
            os.environ["DATABASE_URL"] = original_db_url
        else:
            os.environ.pop("DATABASE_URL", None)


def test_summary_endpoint_aggregates_seeded_dataset(insights_client: TestClient):
    response = insights_client.get("/api/v1/insights/summary")
    assert response.status_code == 200
    payload = response.json()

    assert payload["purchases"] == pytest.approx(4800.0)
    assert payload["sales"] == pytest.approx(7015.0)
    assert payload["expenses"] == pytest.approx(3700.0)
    assert payload["profit"] == pytest.approx(-1485.0)


def test_product_insights_reflect_seeded_totals(insights_client: TestClient):
    response = insights_client.get("/api/v1/insights/products")
    assert response.status_code == 200
    products = response.json()

    assert [p["product_name"] for p in products] == ["Keyboard", "Laptop", "Mouse"]

    laptop = next(p for p in products if p["product_name"] == "Laptop")
    assert laptop["total_bought"] == pytest.approx(4000.0)
    assert laptop["total_sold"] == pytest.approx(6000.0)
    assert laptop["net_profit"] == pytest.approx(2000.0)

    mouse = next(p for p in products if p["product_name"] == "Mouse")
    assert mouse["net_profit"] == pytest.approx(75.0)
