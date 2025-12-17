from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator

from app.models import InvestmentActivityType
from app.core.timezone import ensure_ist


class InvestorCreate(BaseModel):
    name: str


class InvestorOut(BaseModel):
    id: UUID
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

    @field_validator("occurred_at", mode="before")
    @classmethod
    def normalize_occurred_at(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            value = datetime.fromisoformat(value)
        return ensure_ist(value)
