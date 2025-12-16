from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_session_factory
from app.core.security import create_password_hash
from app.models import (
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
from app.core.timezone import ensure_ist


def ist_datetime(value: str) -> datetime:
    return ensure_ist(datetime.fromisoformat(value))


def seed_users(session: Session) -> dict[str, User]:
    existing = {user.email: user for user in session.query(User).all()}

    users_to_create = [
        {"email": "admin@findash.com", "name": "Admin User", "role": UserRole.admin},
        {"email": "partner@findash.com", "name": "John Partner", "role": UserRole.partner},
        {"email": "staff@findash.com", "name": "Jane Staff", "role": UserRole.staff},
    ]

    for data in users_to_create:
        if data["email"] in existing:
            continue
        user = User(
            email=data["email"],
            name=data["name"],
            role=data["role"],
            hashed_password=create_password_hash("password"),
        )
        session.add(user)
        session.flush()
        existing[user.email] = user

    return existing


def seed_transactions(session: Session, users: dict[str, User]):
    if session.query(Transaction).count():
        return

    def _recorded_by(email: str) -> User:
        return users[email]

    entries = [
        {
            "type": TransactionType.buy,
            "product_name": "Laptop",
            "quantity": 5,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("800"),
            "total_amount": Decimal("4000"),
            "person_name": "John Partner",
            "occurred_at": ist_datetime("2024-12-09T00:00:00"),
            "notes": "Bulk purchase",
            "recorded_by": "partner@findash.com",
        },
        {
            "type": TransactionType.sell,
            "product_name": "Laptop",
            "quantity": 3,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("1200"),
            "total_amount": Decimal("3600"),
            "person_name": "Jane Staff",
            "occurred_at": ist_datetime("2024-12-10T00:00:00"),
            "recorded_by": "staff@findash.com",
        },
        {
            "type": TransactionType.expense,
            "expense_category": ExpenseCategory.rent,
            "expense_description": "Office rent for December",
            "total_amount": Decimal("1500"),
            "person_name": "Admin User",
            "occurred_at": ist_datetime("2024-12-01T00:00:00"),
            "recorded_by": "admin@findash.com",
        },
        {
            "type": TransactionType.buy,
            "product_name": "Mouse",
            "quantity": 20,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("15"),
            "total_amount": Decimal("300"),
            "person_name": "John Partner",
            "occurred_at": ist_datetime("2024-12-11T00:00:00"),
            "recorded_by": "partner@findash.com",
        },
        {
            "type": TransactionType.sell,
            "product_name": "Mouse",
            "quantity": 15,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("25"),
            "total_amount": Decimal("375"),
            "person_name": "Jane Staff",
            "occurred_at": ist_datetime("2024-12-12T00:00:00"),
            "recorded_by": "staff@findash.com",
        },
        {
            "type": TransactionType.expense,
            "expense_category": ExpenseCategory.transport,
            "expense_description": "Delivery charges",
            "total_amount": Decimal("200"),
            "person_name": "John Partner",
            "occurred_at": ist_datetime("2024-12-12T00:00:00"),
            "recorded_by": "partner@findash.com",
        },
        {
            "type": TransactionType.buy,
            "product_name": "Keyboard",
            "quantity": 10,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("50"),
            "total_amount": Decimal("500"),
            "person_name": "John Partner",
            "occurred_at": ist_datetime("2024-12-12T12:00:00"),
            "recorded_by": "partner@findash.com",
        },
        {
            "type": TransactionType.sell,
            "product_name": "Keyboard",
            "quantity": 8,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("80"),
            "total_amount": Decimal("640"),
            "person_name": "Jane Staff",
            "occurred_at": ist_datetime("2024-12-13T00:00:00"),
            "recorded_by": "staff@findash.com",
        },
        {
            "type": TransactionType.sell,
            "product_name": "Laptop",
            "quantity": 2,
            "quantity_type": QuantityType.unit,
            "price_per_unit": Decimal("1200"),
            "total_amount": Decimal("2400"),
            "person_name": "John Partner",
            "occurred_at": ist_datetime("2024-12-13T08:00:00"),
            "recorded_by": "partner@findash.com",
        },
        {
            "type": TransactionType.expense,
            "expense_category": ExpenseCategory.salary,
            "expense_description": "Staff salary",
            "total_amount": Decimal("2000"),
            "person_name": "Admin User",
            "occurred_at": ist_datetime("2024-12-13T00:00:00"),
            "recorded_by": "admin@findash.com",
        },
    ]

    for entry in entries:
        recorded_by = _recorded_by(entry.pop("recorded_by"))
        transaction = Transaction(**entry, recorded_by_id=recorded_by.id)
        session.add(transaction)


def seed_investors(session: Session):
    if session.query(Investor).count():
        return

    investors = [
        {
            "name": "Michael Chen",
            "total_invested": Decimal("60000"),
            "total_withdrawn": Decimal("5000"),
            "net_investment": Decimal("55000"),
            "last_activity_at": ist_datetime("2024-12-10T00:00:00"),
            "activities": [
                {
                    "type": InvestmentActivityType.investment,
                    "amount": Decimal("60000"),
                    "occurred_at": ist_datetime("2024-12-01T00:00:00"),
                    "notes": "Initial investment",
                },
                {
                    "type": InvestmentActivityType.withdrawal,
                    "amount": Decimal("5000"),
                    "occurred_at": ist_datetime("2024-12-10T00:00:00"),
                    "notes": "Partial withdrawal",
                },
            ],
        },
        {
            "name": "Sarah Johnson",
            "total_invested": Decimal("40000"),
            "total_withdrawn": Decimal("10000"),
            "net_investment": Decimal("30000"),
            "last_activity_at": ist_datetime("2024-12-05T00:00:00"),
            "activities": [
                {
                    "type": InvestmentActivityType.investment,
                    "amount": Decimal("40000"),
                    "occurred_at": ist_datetime("2024-12-05T00:00:00"),
                    "notes": "First investment",
                },
                {
                    "type": InvestmentActivityType.withdrawal,
                    "amount": Decimal("10000"),
                    "occurred_at": ist_datetime("2024-12-10T00:00:00"),
                    "notes": "Partial withdrawal",
                },
            ],
        },
    ]

    for inv in investors:
        investor = Investor(
            name=inv["name"],
            total_invested=inv["total_invested"],
            total_withdrawn=inv["total_withdrawn"],
            net_investment=inv["net_investment"],
            last_activity_at=inv["last_activity_at"],
        )
        session.add(investor)
        session.flush()

        for activity in inv["activities"]:
            session.add(
                InvestmentActivity(
                    investor_id=investor.id,
                    type=activity["type"],
                    amount=activity["amount"],
                    notes=activity.get("notes"),
                    occurred_at=activity["occurred_at"],
                )
            )


def main():
    settings = get_settings()
    SessionFactory = get_session_factory(settings)
    session = SessionFactory()
    try:
        users = seed_users(session)
        seed_transactions(session, users)
        seed_investors(session)
        session.commit()
        print("Seed data inserted (if not already present).")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
