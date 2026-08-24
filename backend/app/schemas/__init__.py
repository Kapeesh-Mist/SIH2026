"""Pydantic schemas package."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Schema for service health status response."""
    status: str = Field(default="healthy", description="Overall service status")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Active deployment environment")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC Timestamp")
    database: str = Field(default="connected", description="Database connection status")
    details: Optional[Dict[str, Any]] = None


class ReadinessCheckResponse(BaseModel):
    """Schema for container readiness probes."""
    ready: bool = True
    services: Dict[str, bool] = Field(default_factory=lambda: {"database": True, "api": True})


__all__ = [
    "HealthCheckResponse",
    "ReadinessCheckResponse",
]
