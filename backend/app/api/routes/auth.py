from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.dependencies import get_auth_service, get_current_user
from app.models import User
from app.schemas import TokenResponse, LoginRequest, RefreshRequest, LogoutRequest, UserOut
from app.services import AuthService

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    user, tokens = auth_service.authenticate(payload.email, payload.password)
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=auth_service.settings.access_token_expire_minutes * 60,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)):
    user, tokens = auth_service.refresh(payload.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=auth_service.settings.access_token_expire_minutes * 60,
        user=user,
    )


@router.post("/logout")
def logout(payload: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)):
    auth_service.revoke_refresh_token(payload.refresh_token)
    return JSONResponse({"detail": "Logged out"})


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
