from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import configure_logging

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

    @app.get("/health/live", tags=["health"])
    def live_probe() -> dict[str, str]:
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:create_app", factory=True, reload=True)
