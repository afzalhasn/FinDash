from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from .config import Settings, get_settings


_engine = None
_SessionFactory: sessionmaker | None = None


def get_engine(settings: Settings | None = None):
    """Create or return a cached SQLAlchemy engine."""
    global _engine
    if _engine is None:
        settings = settings or get_settings()
        _engine = create_engine(settings.database_url, future=True)
    return _engine


def get_session_factory(settings: Settings | None = None) -> sessionmaker:
    """Return a session factory bound to the configured engine."""
    global _SessionFactory
    if _SessionFactory is None:
        engine = get_engine(settings)
        _SessionFactory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return _SessionFactory


@contextmanager
def get_db_session(settings: Settings | None = None) -> Generator[Session, None, None]:
    """Context manager yielding a database session."""
    factory = get_session_factory(settings)
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def check_database(settings: Settings | None = None) -> bool:
    """Simple readiness check."""
    engine = get_engine(settings)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True
