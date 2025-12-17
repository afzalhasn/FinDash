import uuid

from fastapi import FastAPI, Request
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.database import get_session_factory

def create_app() -> FastAPI:
    """
    Application factory used by Uvicorn (`uvicorn app.main:create_app --factory`).
    Adds placeholder metadata plus a simple health endpoint so scaffolding can be tested.
    """
    settings = get_settings()
    configure_logging(settings)

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Backend service for the FinDash Cash Flow Tracker",
    )

    allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
    allow_all = "*" in allowed_origins
    cors_kwargs = {
        "allow_origins": allowed_origins if not allow_all else ["*"],
        "allow_credentials": not allow_all,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    app.add_middleware(CORSMiddleware, **cors_kwargs)

    @app.middleware("http")
    async def add_correlation_id(request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response

    app.include_router(router)

    @app.get("/health/live", tags=["health"])
    def live_probe() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/ready", tags=["health"])
    def ready_probe():
        factory = get_session_factory(settings)
        with factory() as session:
            session.execute(text("SELECT 1"))
        return {"status": "ready"}

    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:create_app", factory=True, reload=True)
