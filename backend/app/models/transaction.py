import enum

from sqlalchemy import CheckConstraint, Column, DateTime, Enum, Float, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from .base import Base
from .user import User
from app.core.timezone import IST_NOW_SQL, now_ist


class TransactionType(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    expense = "expense"


class ExpenseCategory(str, enum.Enum):
    rent = "rent"
    transport = "transport"
    salary = "salary"
    other = "other"


class QuantityType(str, enum.Enum):
    kg = "kg"
    dozen = "dozen"
    pack = "pack"
    unit = "unit"
    custom = "custom"


class Transaction(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    type = Column(Enum(TransactionType, name="transaction_type"), nullable=False)

    product_name = Column(String(255))
    expense_category = Column(Enum(ExpenseCategory, name="expense_category"))
    expense_description = Column(Text)

    quantity = Column(Float)
    quantity_type = Column(Enum(QuantityType, name="quantity_type"))

    price_per_unit = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2), nullable=False)

    notes = Column(Text)
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=IST_NOW_SQL)

    person_name = Column(String(255))
    recorded_by_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    recorded_by: Mapped["User"] = relationship(User, backref="transactions")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=IST_NOW_SQL)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=IST_NOW_SQL,
        onupdate=now_ist,
    )

    __table_args__ = (
        CheckConstraint(
            "(type = 'expense' AND product_name IS NULL) OR (type IN ('buy','sell') AND product_name IS NOT NULL)",
            name="chk_transaction_product_applicability",
        ),
    )
