import logging
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Investor, InvestmentActivity, InvestmentActivityType
from app.repositories import InvestorRepository, InvestmentActivityRepository

logger = logging.getLogger(__name__)


class InvestorService:
    def __init__(self, investors: InvestorRepository, activities: InvestmentActivityRepository, session: Session):
        self.investors = investors
        self.activities = activities
        self.session = session

    def get_investor(self, investor_id: UUID) -> Investor | None:
        return self.investors.get(investor_id)

    def create_investor(self, investor: Investor) -> Investor:
        existing = self.investors.find_by_name(investor.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Investor already exists")
        if investor.total_invested is None:
            investor.total_invested = Decimal("0")
        if investor.total_withdrawn is None:
            investor.total_withdrawn = Decimal("0")
        if investor.net_investment is None:
            investor.net_investment = Decimal("0")
        self.investors.add(investor)
        self.investors.flush()
        logger.info("Investor created name=%s", investor.name)
        return investor

    def list_investors(self) -> list[Investor]:
        return self.investors.list()

    def add_activity(self, investor: Investor, activity: InvestmentActivity) -> Investor:
        if activity.type == InvestmentActivityType.withdrawal:
            if investor.net_investment < activity.amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawal exceeds net investment"
                )
            investor.total_withdrawn += Decimal(activity.amount)
            investor.net_investment -= Decimal(activity.amount)
        else:
            investor.total_invested += Decimal(activity.amount)
            investor.net_investment += Decimal(activity.amount)

        self.activities.add(activity)
        self.investors.flush()
        try:
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        logger.info("Investor activity recorded investor_id=%s type=%s", investor.id, activity.type)
        return investor
