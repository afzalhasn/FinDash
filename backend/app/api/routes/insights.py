from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_insight_service, require_roles
from app.schemas import InsightSummary, ProductInsight, TimeSeriesPoint
from app.services import InsightService

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/summary", response_model=InsightSummary)
def summary(
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    service: InsightService = Depends(get_insight_service),
    current_user=Depends(require_roles("admin", "partner", "staff")),
):
    return service.summary(start=start, end=end)


@router.get("/products", response_model=list[ProductInsight])
def product_insights(
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    service: InsightService = Depends(get_insight_service),
    current_user=Depends(require_roles("admin", "partner", "staff")),
):
    return service.product_metrics(start=start, end=end)


@router.get("/timeseries", response_model=list[TimeSeriesPoint])
def timeseries(
    interval: str = Query(default="day", regex="^(day|week|month)$"),
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    service: InsightService = Depends(get_insight_service),
    current_user=Depends(require_roles("admin", "partner", "staff")),
):
    return service.timeseries(interval=interval, start=start, end=end)
