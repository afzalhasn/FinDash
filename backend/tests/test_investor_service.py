from decimal import Decimal
import uuid

import pytest
from fastapi import HTTPException

from app.models import Investor, InvestmentActivity, InvestmentActivityType
from app.services.investors import InvestorService


class FakeInvestorRepo:
    def __init__(self):
        self.items = {}

    def list(self):
        return list(self.items.values())

    def add(self, investor):
        self.items[investor.id] = investor

    def flush(self):
        pass

    def find_by_name(self, name):
        return next((inv for inv in self.items.values() if inv.name == name), None)

    def get(self, investor_id):
        return self.items.get(investor_id)


class FakeActivityRepo:
    def __init__(self):
        self.items = []

    def add(self, activity):
        self.items.append(activity)


def make_service():
    investors = FakeInvestorRepo()
    activities = FakeActivityRepo()
    service = InvestorService(investors=investors, activities=activities)
    investor = Investor(
        id=uuid.uuid4(),
        name="Michael",
        total_invested=Decimal("50000"),
        total_withdrawn=Decimal("5000"),
        net_investment=Decimal("45000"),
        last_activity_at=None,
    )
    investors.add(investor)
    return service, investor


def test_add_activity_updates_totals():
    service, investor = make_service()
    activity = InvestmentActivity(
        id=uuid.uuid4(),
        investor_id=investor.id,
        type=InvestmentActivityType.investment,
        amount=Decimal("1000"),
        notes=None,
        occurred_at=None,
    )
    updated = service.add_activity(investor, activity)
    assert updated.net_investment == Decimal("46000")


def test_withdrawal_cannot_exceed_net():
    service, investor = make_service()
    activity = InvestmentActivity(
        id=uuid.uuid4(),
        investor_id=investor.id,
        type=InvestmentActivityType.withdrawal,
        amount=Decimal("999999"),
        notes=None,
        occurred_at=None,
    )
    with pytest.raises(HTTPException):
        service.add_activity(investor, activity)
