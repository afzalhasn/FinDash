from decimal import Decimal

from fastapi import HTTPException, status

from app.models import Investor, InvestmentActivity, InvestmentActivityType
from app.repositories import InvestorRepository, InvestmentActivityRepository


class InvestorService:
    def __init__(self, investors: InvestorRepository, activities: InvestmentActivityRepository):
        self.investors = investors
        self.activities = activities

    def create_investor(self, investor: Investor) -> Investor:
        existing = self.investors.find_by_name(investor.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Investor already exists")
        return self.investors.add(investor)

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
        return investor
