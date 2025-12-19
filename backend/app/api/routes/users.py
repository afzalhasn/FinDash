from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencies import get_user_service, require_roles
from app.models import User
from app.schemas import UserOut, UserCreate, UserUpdate, UserRoleUpdate
from app.services import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut], dependencies=[Depends(require_roles("admin"))])
def list_users(user_service: UserService = Depends(get_user_service)):
    return user_service.list_users()


@router.post("/", response_model=UserOut, dependencies=[Depends(require_roles("admin"))])
def create_user(payload: UserCreate, user_service: UserService = Depends(get_user_service)):
    user = user_service.create_user(
        name=payload.name,
        email=payload.email,
        role=payload.role,
        password=payload.password,
    )
    return user


@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(require_roles("admin"))])
def update_user(user_id: UUID, payload: UserUpdate, user_service: UserService = Depends(get_user_service)):
    user = user_service.update_user(
        user_id,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        password=payload.password,
        disabled=payload.disabled,
    )
    return user


@router.patch("/{user_id}/role", response_model=UserOut, dependencies=[Depends(require_roles("admin"))])
def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    user_service: UserService = Depends(get_user_service),
):
    user = user_service.update_role_status(user_id, role=payload.role, disabled=payload.disabled)
    return user


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_roles("admin"))])
def delete_user(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    user_service.delete_user(user_id)
    return None
