"""
backend/app/main.py — FastAPI app entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import auth, hierarchies, nodes, expenses, alerts, verification

app = FastAPI(
    title="SIH26102 — Hierarchical Financial Monitoring Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """Basic liveness check — used by docker-compose / uptime checks."""
    return {"status": "ok", "environment": settings.environment}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(hierarchies.router, prefix="/hierarchies", tags=["hierarchies"])
app.include_router(nodes.router, prefix="/nodes", tags=["nodes"])
app.include_router(expenses.router, prefix="/nodes", tags=["expenses"])  # nested under /nodes/{id}/expenses
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(verification.router, prefix="/documents", tags=["verification"])  # /documents/{id}/verify