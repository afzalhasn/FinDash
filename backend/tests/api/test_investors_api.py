import uuid
from decimal import Decimal

from app.models import InvestmentActivityType


def test_list_investors_returns_records(authorized_client, investor_factory):
    investor_factory(name="Investor Alpha", invested=Decimal("1000"))
    investor_factory(name="Investor Beta", invested=Decimal("500"))

    response = authorized_client.get("/api/v1/investors/")

    assert response.status_code == 200
    names = [row["name"] for row in response.json()]
    assert "Investor Alpha" in names
    assert "Investor Beta" in names


def test_create_investor_persists_unique_name(authorized_client):
    payload = {"name": "Fresh Investor"}

    response = authorized_client.post("/api/v1/investors/", json=payload)

    assert response.status_code == 201
    assert response.json()["name"] == payload["name"]


def test_get_investor_returns_404_for_unknown_id(authorized_client):
    response = authorized_client.get(f"/api/v1/investors/{uuid.uuid4()}")

    assert response.status_code == 404


def test_get_investor_returns_record(authorized_client, investor_factory):
    investor = investor_factory(name="Lookup Investor", invested=Decimal("2500"))

    response = authorized_client.get(f"/api/v1/investors/{investor.id}")

    assert response.status_code == 200
    assert response.json()["name"] == "Lookup Investor"


def test_add_activity_updates_balances(authorized_client, investor_factory):
    investor = investor_factory(name="Balance Investor", invested=Decimal("1000"), withdrawn=Decimal("200"))
    payload = {
        "type": InvestmentActivityType.investment.value,
        "amount": "500",
        "notes": "top-up",
    }

    response = authorized_client.post(f"/api/v1/investors/{investor.id}/activities", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert float(body["total_invested"]) == float(Decimal("1500"))
    assert float(body["net_investment"]) == float(Decimal("1300"))


def test_add_activity_rejects_excessive_withdrawal(authorized_client, investor_factory):
    investor = investor_factory(name="Withdrawal Investor", invested=Decimal("1000"), withdrawn=Decimal("200"))
    payload = {
        "type": InvestmentActivityType.withdrawal.value,
        "amount": "5000",
        "notes": "too much",
    }

    response = authorized_client.post(f"/api/v1/investors/{investor.id}/activities", json=payload)

    assert response.status_code == 400
