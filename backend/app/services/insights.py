from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction, TransactionType


class InsightService:
    def __init__(self, session: Session):
        self.session = session

    def summary(self, start: datetime | None = None, end: datetime | None = None) -> Dict[str, Any]:
        stmt = select(
            func.sum(
                func.case(
                    (Transaction.type == TransactionType.buy, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("purchases"),
            func.sum(
                func.case(
                    (Transaction.type == TransactionType.sell, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("sales"),
            func.sum(
                func.case(
                    (Transaction.type == TransactionType.expense, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("expenses"),
        )
        if start:
            stmt = stmt.where(Transaction.occurred_at >= start)
        if end:
            stmt = stmt.where(Transaction.occurred_at <= end)

        row = self.session.execute(stmt).one()
        purchases = row.purchases or Decimal("0")
        sales = row.sales or Decimal("0")
        expenses = row.expenses or Decimal("0")

        profit = sales - purchases - expenses

        return {
            "purchases": float(purchases),
            "sales": float(sales),
            "expenses": float(expenses),
            "profit": float(profit),
        }
