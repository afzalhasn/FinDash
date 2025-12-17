from sqlalchemy.orm import Session

from app.models import RevokedToken
from .base import BaseRepository


class RevokedTokenRepository(BaseRepository[RevokedToken]):
    model = RevokedToken

    def __init__(self, session: Session):
        super().__init__(session)

    def exists(self, token: str) -> bool:
        return self.session.query(RevokedToken).filter(RevokedToken.token == token).first() is not None
