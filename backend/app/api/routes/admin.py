from fastapi import APIRouter, Depends

from app.api.dependencies import get_maintenance_service, require_roles
from app.services import MaintenanceService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset-database", dependencies=[Depends(require_roles("admin"))])
def reset_database(service: MaintenanceService = Depends(get_maintenance_service)):
    service.reset_database()
    return {"detail": "Database reset and seeded"}
