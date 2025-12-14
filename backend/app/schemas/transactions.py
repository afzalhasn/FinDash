from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel

from app.models import TransactionType, QuantityType, ExpenseCategory


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


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: str
    person_name: str

    class Config:
        from_attributes = True
