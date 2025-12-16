from datetime import datetime
from decimal import Decimal

from app.core.timezone import ensure_ist
from app.models import ExpenseCategory, Transaction, TransactionType


def test_list_transactions_supports_filters(authorized_client, transaction_factory):
    transaction_factory(product_name="Alpha Gadget")
    transaction_factory(product_name="Beta Item")

    response = authorized_client.get("/api/v1/transactions/", params={"product": "alpha"})

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["product_name"] == "Alpha Gadget"


def test_create_buy_transaction_records_current_user(
    authorized_client, current_user_override, partner_user
):
    current_user_override(partner_user)
    payload = {
        "type": TransactionType.buy.value,
        "product_name": "Monitor",
        "quantity": 5,
        "quantity_type": "unit",
        "price_per_unit": "200",
        "total_amount": "1000",
        "notes": "restock",
        "occurred_at": ensure_ist(datetime.utcnow()).isoformat(),
    }

    response = authorized_client.post("/api/v1/transactions/", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["product_name"] == payload["product_name"]
    assert body["person_name"] == partner_user.name


def test_create_sell_transaction_without_inventory_fails(authorized_client, current_user_override, partner_user):
    current_user_override(partner_user)
    payload = {
        "type": TransactionType.sell.value,
        "product_name": "Nonexistent",
        "quantity": 1,
        "quantity_type": "unit",
        "price_per_unit": "10",
        "total_amount": "10",
        "notes": "attempted sale",
        "occurred_at": ensure_ist(datetime.utcnow()).isoformat(),
    }

    response = authorized_client.post("/api/v1/transactions/", json=payload)

    assert response.status_code == 400


def test_update_transaction_modifies_record(authorized_client, transaction_factory):
    transaction = transaction_factory(product_name="Tablet", total_amount=Decimal("500"))
    payload = {
        "type": TransactionType.buy.value,
        "product_name": "Tablet",
        "quantity": 10,
        "quantity_type": "unit",
        "price_per_unit": "75",
        "total_amount": "750",
        "notes": "updated",
        "occurred_at": ensure_ist(datetime.utcnow()).isoformat(),
    }

    response = authorized_client.patch(f"/api/v1/transactions/{transaction.id}", json=payload)

    assert response.status_code == 200
    assert Decimal(str(response.json()["total_amount"])) == Decimal(payload["total_amount"])


def test_delete_transaction_removes_record(authorized_client, transaction_factory, db_session):
    transaction = transaction_factory(product_name="To Be Deleted")

    response = authorized_client.delete(f"/api/v1/transactions/{transaction.id}")

    assert response.status_code == 204
    db_session.expire_all()
    assert db_session.get(Transaction, transaction.id) is None


def test_available_products_returns_sorted_names(authorized_client, transaction_factory):
    transaction_factory(product_name="Mouse", type_=TransactionType.buy)
    transaction_factory(product_name="Keyboard", type_=TransactionType.buy)
    transaction_factory(type_=TransactionType.expense, expense_category=ExpenseCategory.rent)

    response = authorized_client.get("/api/v1/transactions/products/available")

    assert response.status_code == 200
    assert response.json() == ["Keyboard", "Mouse"]
