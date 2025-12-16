from sqlalchemy import Column, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text

from .base import Base
from app.core.timezone import IST_NOW_SQL, now_ist


class Investor(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(255), nullable=False, unique=True)

    total_invested = Column(Numeric(14, 2), nullable=False, default=0)
    total_withdrawn = Column(Numeric(14, 2), nullable=False, default=0)
    net_investment = Column(Numeric(14, 2), nullable=False, default=0)
    last_activity_at = Column(DateTime(timezone=True), server_default=IST_NOW_SQL)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=IST_NOW_SQL)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=IST_NOW_SQL,
        onupdate=now_ist,
    )

    activities = relationship("InvestmentActivity", back_populates="investor", cascade="all, delete-orphan")
