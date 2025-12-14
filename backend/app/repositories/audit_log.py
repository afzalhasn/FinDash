from sqlalchemy.orm import Session

from app.models import AuditLog
from .base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    model = AuditLog

    def __init__(self, session: Session):
        super().__init__(session)
