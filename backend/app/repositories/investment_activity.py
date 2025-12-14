from sqlalchemy.orm import Session

from app.models import InvestmentActivity
from .base import BaseRepository


class InvestmentActivityRepository(BaseRepository[InvestmentActivity]):
    model = InvestmentActivity

    def __init__(self, session: Session):
        super().__init__(session)
