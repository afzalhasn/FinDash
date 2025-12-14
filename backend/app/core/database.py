"""
Database helpers. These are placeholders until SQLAlchemy is wired in.
"""
from contextlib import contextmanager
from typing import Generator

from .config import Settings


def create_database_engine(settings: Settings):
    """
    Placeholder factory for a database engine.
    Replace with actual SQLAlchemy engine once dependencies are added.
    """
    return {"url": settings.database_url}


@contextmanager
def get_db_session(settings: Settings) -> Generator[dict, None, None]:
    """
    Placeholder DB session context manager.
    Provides a dict representing the session for now.
    """
    engine = create_database_engine(settings)
    session = {"engine": engine, "closed": False}
    try:
        yield session
    finally:
        session["closed"] = True
