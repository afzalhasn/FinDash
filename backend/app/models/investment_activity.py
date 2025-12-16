import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text

from .base import Base
from app.core.timezone import IST_NOW_SQL


class InvestmentActivityType(str, enum.Enum):
    investment = "investment"
    withdrawal = "withdrawal"


class InvestmentActivity(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    investor_id = Column(UUID(as_uuid=True), ForeignKey("investor.id"), nullable=False, index=True)
    type = Column(Enum(InvestmentActivityType, name="investment_activity_type"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    notes = Column(Text)
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=IST_NOW_SQL)
    created_by = Column(String(255))

    investor = relationship("Investor", back_populates="activities")
