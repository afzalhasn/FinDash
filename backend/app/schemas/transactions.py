from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models import TransactionType, QuantityType, ExpenseCategory
from app.core.timezone import ensure_ist


class TransactionBase(BaseModel):
    type: TransactionType
    product_name: Optional[str] = None
    expense_category: Optional[ExpenseCategory] = None
    expense_description: Optional[str] = None
    quantity: Optional[float] = None
    quantity_type: Optional[QuantityType] = None
    price_per_unit: Optional[Decimal] = None
    total_amount: Decimal
    notes: Optional[str] = None
    occurred_at: datetime

    @field_validator("occurred_at", mode="before")
    @classmethod
    def ensure_timezone(cls, value):
        if isinstance(value, str):
            value = datetime.fromisoformat(value)
        converted = ensure_ist(value)
        assert converted is not None
        return converted


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: UUID
    person_name: str

    model_config = ConfigDict(from_attributes=True)
