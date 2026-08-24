"""Unit tests for system health, readiness, and root endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint returns basic application metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == settings.PROJECT_NAME
    assert data["status"] == "online"
    assert "docs" in data


def test_health_check_endpoint():
    """Verify /api/v1/health returns healthy status and required keys."""
    response = client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == settings.PROJECT_NAME
    assert data["version"] == settings.VERSION
    assert "timestamp" in data
    assert "database" in data


def test_readiness_probe_endpoint():
    """Verify /api/v1/ready returns readiness confirmation."""
    response = client.get(f"{settings.API_V1_STR}/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert "database" in data["services"]
