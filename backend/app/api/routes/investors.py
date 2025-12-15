from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_investor_service, require_roles
from app.schemas import InvestorCreate, InvestorOut, InvestmentActivityCreate
from app.services import InvestorService
from app.models import Investor, InvestmentActivity

router = APIRouter(prefix="/investors", tags=["investors"], dependencies=[Depends(require_roles("admin"))])


@router.get("/", response_model=list[InvestorOut])
def list_investors(service: InvestorService = Depends(get_investor_service)):
    return service.list_investors()


@router.post("/", response_model=InvestorOut, status_code=201)
def create_investor(payload: InvestorCreate, service: InvestorService = Depends(get_investor_service)):
    investor = Investor(name=payload.name)
    return service.create_investor(investor)


@router.get("/{investor_id}", response_model=InvestorOut)
def get_investor(investor_id: UUID, service: InvestorService = Depends(get_investor_service)):
    investor = service.get_investor(investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return investor


@router.post("/{investor_id}/activities", response_model=InvestorOut)
def add_activity(
    investor_id: UUID,
    payload: InvestmentActivityCreate,
    service: InvestorService = Depends(get_investor_service),
):
    investor = service.get_investor(investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    activity = InvestmentActivity(
        investor_id=investor.id,
        type=payload.type,
        amount=payload.amount,
        notes=payload.notes,
        occurred_at=payload.occurred_at or datetime.utcnow(),
    )
    updated = service.add_activity(investor, activity)
    return updated
