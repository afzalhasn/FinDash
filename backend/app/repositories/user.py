from sqlalchemy.orm import Session

from app.models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def __init__(self, session: Session):
        super().__init__(session)

    def find_by_email(self, email: str) -> User | None:
        return self.session.query(User).filter(User.email == email).one_or_none()
