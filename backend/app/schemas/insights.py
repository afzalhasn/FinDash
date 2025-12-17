from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class InsightSummary(BaseModel):
    purchases: float
    sales: float
    expenses: float
    profit: float
    total_cash_in: float


class ProductInsight(BaseModel):
    product_name: str
    total_sold: float
    total_bought: float
    net_profit: float


class TimeSeriesPoint(BaseModel):
    bucket: datetime
    purchases: float
    sales: float
    expenses: float
