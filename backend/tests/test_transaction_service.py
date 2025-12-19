import uuid

import pytest
from fastapi import HTTPException

from app.models import QuantityType, Transaction, TransactionType, User, UserRole
from app.services.transactions import TransactionService
from app.schemas.transactions import TransactionCreate
from app.core.timezone import now_ist


class FakeTransactionRepo:
    def __init__(self):
        self.transactions = []
        self.products = set()
        self.inventory = {}

    def search(self, **kwargs):
        return self.transactions

    def get_available_products(self):
        return sorted(self.products)

    def set_inventory(self, product_name, quantity_type, quantity):
        self.products.add(product_name)
        self.inventory[(product_name, quantity_type)] = quantity

    def get_available_quantity(self, product_name, quantity_type, *, exclude_transaction_id=None):
        return self.inventory.get((product_name, quantity_type), 0)

    def add(self, transaction):
        self.transactions.append(transaction)

    def flush(self):
        pass

    def get(self, transaction_id):
        for txn in self.transactions:
            if txn.id == transaction_id:
                return txn
        return None

    def delete(self, transaction):
        self.transactions.remove(transaction)


def make_service():
    repo = FakeTransactionRepo()
    repo.set_inventory("Laptop", QuantityType.unit, 10)
    service = TransactionService(transactions=repo)
    user = User(id=uuid.uuid4(), name="Partner", email="partner@findash.com", role=UserRole.partner, hashed_password="")
    return service, repo, user


def make_payload(product="Laptop", type_=TransactionType.sell):
    return TransactionCreate(
        type=type_,
        product_name=product,
        quantity=1,
        quantity_type=QuantityType.unit,
        price_per_unit=None,
        total_amount=100,
        notes=None,
        occurred_at=now_ist(),
    )


def test_create_transaction_validates_inventory():
    service, repo, user = make_service()
    payload = make_payload()
    txn = service.create_transaction(payload, user)
    assert txn.person_name == user.name
    assert repo.transactions


def test_create_transaction_rejects_unknown_product():
    service, repo, user = make_service()
    payload = make_payload(product="Unknown")
    with pytest.raises(HTTPException):
        service.create_transaction(payload, user)
