from fastapi import APIRouter

from .routes import auth, users, transactions, admin, insights, investors

router = APIRouter()
router.include_router(auth.router, prefix="/api/v1/auth")
router.include_router(users.router, prefix="/api/v1")
router.include_router(transactions.router, prefix="/api/v1")
router.include_router(admin.router, prefix="/api/v1")
router.include_router(insights.router, prefix="/api/v1")
router.include_router(investors.router, prefix="/api/v1")
