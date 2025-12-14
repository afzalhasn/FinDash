from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_transaction_service, require_roles
from app.models import TransactionType, User
from app.schemas import TransactionOut, TransactionCreate
from app.services import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    type: Optional[TransactionType] = Query(default=None),
    product: Optional[str] = Query(default=None),
    person: Optional[str] = Query(default=None),
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    current_user: User = Depends(require_roles("admin", "partner", "staff")),
    service: TransactionService = Depends(get_transaction_service),
):
    return service.list_transactions(type_=type, product=product, person=person, start=start, end=end)


@router.post("/", response_model=TransactionOut)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(require_roles("admin", "partner")),
    service: TransactionService = Depends(get_transaction_service),
):
    transaction = service.create_transaction(payload, current_user)
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionOut, dependencies=[Depends(require_roles("admin", "partner"))])
def update_transaction(
    transaction_id: str,
    payload: TransactionCreate,
    service: TransactionService = Depends(get_transaction_service),
):
    return service.update_transaction(transaction_id, payload)


@router.delete("/{transaction_id}", status_code=204, dependencies=[Depends(require_roles("admin"))])
def delete_transaction(transaction_id: str, service: TransactionService = Depends(get_transaction_service)):
    service.delete_transaction(transaction_id)
    return {"detail": "deleted"}


@router.get("/products/available", response_model=list[str])
def available_products(
    service: TransactionService = Depends(get_transaction_service),
    current_user: User = Depends(require_roles("admin", "partner", "staff")),
):
    return service.get_available_products()
