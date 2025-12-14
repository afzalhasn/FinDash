from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Transaction, TransactionType
from .base import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    model = Transaction

    def __init__(self, session: Session):
        super().__init__(session)

    def search(
        self,
        *,
        type_: TransactionType | None = None,
        product: str | None = None,
        person: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[Transaction]:
        query = select(Transaction)

        if type_:
            query = query.where(Transaction.type == type_)
        if product:
            ilike = f"%{product.lower()}%"
            query = query.where(Transaction.product_name.ilike(ilike))
        if person:
            ilike = f"%{person.lower()}%"
            query = query.where(Transaction.person_name.ilike(ilike))
        if start:
            query = query.where(Transaction.occurred_at >= start)
        if end:
            query = query.where(Transaction.occurred_at <= end)

        query = query.order_by(Transaction.occurred_at.desc())

        return self.session.scalars(query).all()

    def get_available_products(self) -> list[str]:
        stmt = select(Transaction.product_name).where(
            Transaction.type == TransactionType.buy,
            Transaction.product_name.isnot(None),
        )
        products = {row[0] for row in self.session.execute(stmt)}
        return sorted(products)
