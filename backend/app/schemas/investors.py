from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models import InvestmentActivityType


class InvestorCreate(BaseModel):
    name: str


class InvestorOut(BaseModel):
    id: str
    name: str
    total_invested: Decimal
    total_withdrawn: Decimal
    net_investment: Decimal
    last_activity_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvestmentActivityCreate(BaseModel):
    type: InvestmentActivityType
    amount: Decimal
    notes: Optional[str] = None
    occurred_at: Optional[datetime] = None
