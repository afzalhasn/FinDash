from datetime import datetime
from decimal import Decimal

from app.core.timezone import ensure_ist
from app.models import TransactionType


def test_summary_returns_totals(authorized_client, transaction_factory):
    transaction_factory(type_=TransactionType.buy, total_amount=Decimal("100"))
    transaction_factory(type_=TransactionType.sell, total_amount=Decimal("250"))
    transaction_factory(type_=TransactionType.expense, total_amount=Decimal("50"))

    response = authorized_client.get("/api/v1/insights/summary")

    assert response.status_code == 200
    data = response.json()
    assert data["purchases"] == 100.0
    assert data["sales"] == 250.0
    assert data["expenses"] == 50.0
    assert data["profit"] == 100.0


def test_product_insights_group_metrics(authorized_client, transaction_factory):
    transaction_factory(type_=TransactionType.buy, product_name="Widget", total_amount=Decimal("100"))
    transaction_factory(type_=TransactionType.sell, product_name="Widget", total_amount=Decimal("140"))
    transaction_factory(type_=TransactionType.sell, product_name="Gadget", total_amount=Decimal("40"))

    response = authorized_client.get("/api/v1/insights/products")

    assert response.status_code == 200
    products = {row["product_name"]: row for row in response.json()}
    assert products["Widget"]["total_bought"] == 100.0
    assert products["Widget"]["total_sold"] == 140.0
    assert products["Widget"]["net_profit"] == 40.0
    assert products["Gadget"]["total_sold"] == 40.0


def test_timeseries_returns_chronological_buckets(authorized_client, transaction_factory):
    first_day = ensure_ist(datetime(2024, 1, 1, 10, 0, 0))
    second_day = ensure_ist(datetime(2024, 1, 2, 10, 0, 0))
    transaction_factory(type_=TransactionType.buy, total_amount=Decimal("50"), occurred_at=first_day)
    transaction_factory(type_=TransactionType.sell, total_amount=Decimal("75"), occurred_at=second_day)

    response = authorized_client.get("/api/v1/insights/timeseries", params={"interval": "day"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    buckets = [entry["bucket"] for entry in body]
    assert buckets[0] < buckets[1]
