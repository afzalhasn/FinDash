from fastapi import APIRouter

from .routes import auth, users, transactions

router = APIRouter()
router.include_router(auth.router, prefix="/api/v1/auth")
router.include_router(users.router, prefix="/api/v1")
router.include_router(transactions.router, prefix="/api/v1")
