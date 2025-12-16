from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List

from sqlalchemy import func, select, case
from sqlalchemy.orm import Session

from app.models import Transaction, TransactionType
from app.core.timezone import ensure_ist


class InsightService:
    def __init__(self, session: Session):
        self.session = session

    def summary(self, start: datetime | None = None, end: datetime | None = None) -> Dict[str, Any]:
        start = ensure_ist(start)
        end = ensure_ist(end)
        stmt = select(
            func.sum(
                case(
                    (Transaction.type == TransactionType.buy, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("purchases"),
            func.sum(
                case(
                    (Transaction.type == TransactionType.sell, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("sales"),
            func.sum(
                case(
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

    def product_metrics(self, start: datetime | None = None, end: datetime | None = None) -> List[dict[str, Any]]:
        start = ensure_ist(start)
        end = ensure_ist(end)
        stmt = (
            select(
                Transaction.product_name.label("product"),
                func.sum(
                    case(
                        (Transaction.type == TransactionType.sell, Transaction.total_amount),
                        else_=Decimal("0"),
                    )
                ).label("sales"),
                func.sum(
                    case(
                        (Transaction.type == TransactionType.buy, Transaction.total_amount),
                        else_=Decimal("0"),
                    )
                ).label("purchases"),
            )
            .where(Transaction.product_name.isnot(None))
            .group_by(Transaction.product_name)
            .order_by(Transaction.product_name.asc())
        )

        if start:
            stmt = stmt.where(Transaction.occurred_at >= start)
        if end:
            stmt = stmt.where(Transaction.occurred_at <= end)

        rows = self.session.execute(stmt).all()
        insights = []
        for row in rows:
            sales = row.sales or Decimal("0")
            purchases = row.purchases or Decimal("0")
            insights.append(
                {
                    "product_name": row.product,
                    "total_sold": float(sales),
                    "total_bought": float(purchases),
                    "net_profit": float(sales - purchases),
                }
            )
        return insights

    def timeseries(
        self,
        interval: str = "day",
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> List[dict[str, Any]]:
        start = ensure_ist(start)
        end = ensure_ist(end)
        trunc_map = {"day": "day", "week": "week", "month": "month"}
        if interval not in trunc_map:
            raise ValueError("Invalid interval")

        bucket = func.date_trunc(trunc_map[interval], Transaction.occurred_at).label("bucket")
        stmt = select(
            bucket,
            func.sum(
                case(
                    (Transaction.type == TransactionType.buy, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("purchases"),
            func.sum(
                case(
                    (Transaction.type == TransactionType.sell, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("sales"),
            func.sum(
                case(
                    (Transaction.type == TransactionType.expense, Transaction.total_amount),
                    else_=Decimal("0"),
                )
            ).label("expenses"),
        ).group_by(bucket).order_by(bucket)

        if start:
            stmt = stmt.where(Transaction.occurred_at >= start)
        if end:
            stmt = stmt.where(Transaction.occurred_at <= end)

        rows = self.session.execute(stmt).all()
        return [
            {
                "bucket": row.bucket,
                "purchases": float(row.purchases or Decimal("0")),
                "sales": float(row.sales or Decimal("0")),
                "expenses": float(row.expenses or Decimal("0")),
            }
            for row in rows
        ]
