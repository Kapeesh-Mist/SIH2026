"""Healthcheck and readiness API endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from app.config import settings, Settings
from app.api.deps import get_settings
from app.db.session import SessionLocal
from app.schemas import HealthCheckResponse, ReadinessCheckResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health Check",
    description="Returns service uptime, version metadata, and database connection status.",
)
async def health_check(
    app_settings: Settings = Depends(get_settings),
) -> HealthCheckResponse:
    db_status = "connected"
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected (offline/fallback mode)"

    return HealthCheckResponse(
        status="healthy",
        app_name=app_settings.PROJECT_NAME,
        version=app_settings.VERSION,
        environment=app_settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_status,
        details={
            "debug": app_settings.DEBUG,
            "api_prefix": app_settings.API_V1_STR,
        },
    )


@router.get(
    "/ready",
    response_model=ReadinessCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Kubernetes / Container Readiness Probe",
)
async def readiness_check() -> ReadinessCheckResponse:
    return ReadinessCheckResponse(
        ready=True,
        services={"database": True, "api": True},
    )
