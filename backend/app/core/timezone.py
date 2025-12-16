from __future__ import annotations

from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.sql import text

IST_TIMEZONE = ZoneInfo("Asia/Kolkata")
IST_NOW_SQL = text("timezone('Asia/Kolkata', now())")


def now_ist() -> datetime:
    """Return the current datetime in IST."""
    return datetime.now(tz=IST_TIMEZONE)


def ensure_ist(value: Optional[datetime]) -> Optional[datetime]:
    """Normalize incoming datetimes (possibly naive) to IST."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=IST_TIMEZONE)
    return value.astimezone(IST_TIMEZONE)
