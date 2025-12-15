from datetime import datetime

import logging

from fastapi import HTTPException, status

from app.models import Transaction, TransactionType, User
from app.repositories import TransactionRepository
from app.schemas.transactions import TransactionCreate

logger = logging.getLogger(__name__)


class TransactionService:
    def __init__(self, transactions: TransactionRepository):
        self.transactions = transactions

    def list_transactions(
        self,
        *,
        type_: TransactionType | None = None,
        product: str | None = None,
        person: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[Transaction]:
        return self.transactions.search(type_=type_, product=product, person=person, start=start, end=end)

    def create_transaction(self, payload: TransactionCreate, user: User) -> Transaction:
        if payload.type == TransactionType.sell:
            available = self.transactions.get_available_products()
            if payload.product_name not in available:
                logger.warning("Sell transaction rejected - product not in inventory product=%s", payload.product_name)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot sell product with no inventory",
                )

        transaction = Transaction(
            **payload.dict(),
            person_name=user.name,
            recorded_by_id=user.id,
        )
        self.transactions.add(transaction)
        self.transactions.flush()
        logger.info("Transaction created id=%s type=%s", transaction.id, transaction.type)
        return transaction

    def update_transaction(self, transaction_id, payload: TransactionCreate) -> Transaction:
        transaction = self.transactions.get(transaction_id)
        if not transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

        if payload.type == TransactionType.sell:
            available = self.transactions.get_available_products()
            if payload.product_name not in available:
                logger.warning("Sell update rejected product=%s", payload.product_name)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot sell product with no inventory",
                )

        for field, value in payload.dict().items():
            setattr(transaction, field, value)
        self.transactions.flush()
        logger.info("Transaction updated id=%s", transaction_id)
        return transaction

    def delete_transaction(self, transaction_id) -> None:
        transaction = self.transactions.get(transaction_id)
        if not transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        self.transactions.delete(transaction)
        logger.info("Transaction deleted id=%s", transaction_id)

    def get_available_products(self) -> list[str]:
        return self.transactions.get_available_products()
