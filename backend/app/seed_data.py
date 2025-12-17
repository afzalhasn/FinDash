from __future__ import annotations

from datetime import datetime, timedelta
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
from app.core.timezone import ensure_ist, now_ist


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

    catalog = [
        {"name": "Laptop", "quantity_type": QuantityType.unit, "buy": Decimal("800"), "sell": Decimal("1200")},
        {"name": "Mouse", "quantity_type": QuantityType.unit, "buy": Decimal("20"), "sell": Decimal("30")},
        {"name": "Keyboard", "quantity_type": QuantityType.unit, "buy": Decimal("45"), "sell": Decimal("70")},
        {"name": "Monitor", "quantity_type": QuantityType.unit, "buy": Decimal("220"), "sell": Decimal("320")},
        {"name": "SSD", "quantity_type": QuantityType.unit, "buy": Decimal("60"), "sell": Decimal("95")},
    ]
    expense_categories = [
        ExpenseCategory.rent,
        ExpenseCategory.transport,
        ExpenseCategory.salary,
        ExpenseCategory.other,
    ]
    people = [
        ("Admin User", "admin@findash.com"),
        ("John Partner", "partner@findash.com"),
        ("Jane Staff", "staff@findash.com"),
    ]

    start_date = now_ist() - timedelta(days=60)
    entries: list[dict] = []

    for i in range(100):
        day_offset = i % 60
        occurred_at = start_date + timedelta(days=day_offset, hours=i % 12)
        person_name, recorded_email = people[i % len(people)]

        if i % 4 == 0:
            category = expense_categories[i % len(expense_categories)]
            base_amount = Decimal(150 + (i % 7) * 35)
            entries.append(
                {
                    "type": TransactionType.expense,
                    "expense_category": category,
                    "expense_description": f"{category.value.title()} expense #{i + 1}",
                    "total_amount": base_amount,
                    "person_name": person_name,
                    "occurred_at": occurred_at,
                    "notes": "Auto-generated expense entry",
                    "recorded_by": recorded_email,
                }
            )
        elif i % 4 == 1:
            product = catalog[i % len(catalog)]
            quantity = (i % 5 + 1) * 2
            price_per_unit = product["buy"]
            entries.append(
                {
                    "type": TransactionType.buy,
                    "product_name": product["name"],
                    "quantity": quantity,
                    "quantity_type": product["quantity_type"],
                    "price_per_unit": price_per_unit,
                    "total_amount": price_per_unit * Decimal(quantity),
                    "person_name": person_name,
                    "occurred_at": occurred_at,
                    "notes": f"Restock {product['name']}",
                    "recorded_by": recorded_email,
                }
            )
        else:
            product = catalog[i % len(catalog)]
            quantity = (i % 3 + 1) * 2
            price_per_unit = product["sell"]
            entries.append(
                {
                    "type": TransactionType.sell,
                    "product_name": product["name"],
                    "quantity": quantity,
                    "quantity_type": product["quantity_type"],
                    "price_per_unit": price_per_unit,
                    "total_amount": price_per_unit * Decimal(quantity),
                    "person_name": person_name,
                    "occurred_at": occurred_at,
                    "notes": f"Sale of {product['name']}",
                    "recorded_by": recorded_email,
                }
            )

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
