import logging
from datetime import datetime

from fastapi import HTTPException, status

from app.models import Transaction, TransactionType, User
from app.repositories import TransactionRepository
from app.schemas.transactions import TransactionCreate
from app.core.timezone import ensure_ist

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
        return self.transactions.search(
            type_=type_,
            product=product,
            person=person,
            start=ensure_ist(start),
            end=ensure_ist(end),
        )

    def _validate_sell_transaction(
        self,
        payload: TransactionCreate,
        *,
        exclude_transaction_id: str | None = None,
    ) -> None:
        if not payload.product_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product name is required for sales")
        if payload.quantity_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity type is required for sales",
            )
        if payload.quantity is None or payload.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than zero",
            )

        available_qty = self.transactions.get_available_quantity(
            payload.product_name,
            payload.quantity_type,
            exclude_transaction_id=exclude_transaction_id,
        )

        if available_qty <= 0:
            logger.warning(
                "Sell transaction rejected - no inventory product=%s qty_type=%s",
                payload.product_name,
                payload.quantity_type,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot sell product with no matching inventory",
            )
        if payload.quantity > available_qty:
            logger.warning(
                "Sell transaction rejected - insufficient inventory product=%s requested=%s available=%s",
                payload.product_name,
                payload.quantity,
                available_qty,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {available_qty:.2f} units available for sale",
            )

    def create_transaction(self, payload: TransactionCreate, user: User) -> Transaction:
        if payload.type == TransactionType.sell:
            self._validate_sell_transaction(payload)

        transaction = Transaction(
            **payload.model_dump(),
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
            self._validate_sell_transaction(payload, exclude_transaction_id=str(transaction.id))

        for field, value in payload.model_dump().items():
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
