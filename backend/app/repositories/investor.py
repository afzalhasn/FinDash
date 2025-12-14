from sqlalchemy.orm import Session

from app.models import Investor
from .base import BaseRepository


class InvestorRepository(BaseRepository[Investor]):
    model = Investor

    def __init__(self, session: Session):
        super().__init__(session)

    def find_by_name(self, name: str) -> Investor | None:
        return self.session.query(Investor).filter(Investor.name == name).one_or_none()
