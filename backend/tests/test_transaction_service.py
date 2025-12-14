from datetime import datetime
import uuid

import pytest
from fastapi import HTTPException

from app.models import Transaction, TransactionType, User, UserRole
from app.services.transactions import TransactionService
from app.schemas.transactions import TransactionCreate


class FakeTransactionRepo:
    def __init__(self):
        self.transactions = []
        self.products = ["Laptop"]

    def search(self, **kwargs):
        return self.transactions

    def get_available_products(self):
        return self.products

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
    service = TransactionService(transactions=repo)
    user = User(id=uuid.uuid4(), name="Partner", email="partner@findash.com", role=UserRole.partner, hashed_password="")
    return service, repo, user


def make_payload(product="Laptop", type_=TransactionType.sell):
    return TransactionCreate(
        type=type_,
        product_name=product,
        quantity=1,
        quantity_type=None,
        price_per_unit=None,
        total_amount=100,
        notes=None,
        occurred_at=datetime.utcnow(),
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
