from datetime import datetime

from fastapi import HTTPException, status

from app.models import Transaction, TransactionType
from app.repositories import TransactionRepository


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

    def create_transaction(self, transaction: Transaction) -> Transaction:
        if transaction.type == TransactionType.sell:
            available = self.transactions.get_available_products()
            if transaction.product_name not in available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot sell product with no inventory",
                )
        return self.transactions.add(transaction)

    def get_available_products(self) -> list[str]:
        return self.transactions.get_available_products()
