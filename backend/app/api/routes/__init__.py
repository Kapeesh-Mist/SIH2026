"""API routes aggregation."""

from fastapi import APIRouter
from app.api.routes.health import router as health_router

api_router = APIRouter()

# Register sub-routers
api_router.include_router(health_router, prefix="", tags=["Health & Status"])

__all__ = ["api_router"]
