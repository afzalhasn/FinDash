from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_engine, get_session_factory
from app.models import Base
from app.seed_data import seed_users, seed_transactions, seed_investors


class MaintenanceService:
    """Service layer utilities used for administrative maintenance tasks."""

    def __init__(self, session: Session, settings: Settings | None = None):
        self.session = session
        self.settings = settings or get_settings()

    def reset_database(self) -> None:
        """Drop and recreate all tables, then run the standard seed routines."""
        engine = self.session.get_bind()
        if engine is None:
            engine = get_engine(self.settings)

        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        session_factory = get_session_factory(self.settings)
        seed_session = session_factory()
        try:
            users = seed_users(seed_session)
            seed_transactions(seed_session, users)
            seed_investors(seed_session)
            seed_session.commit()
        except Exception:
            seed_session.rollback()
            raise
        finally:
            seed_session.close()
