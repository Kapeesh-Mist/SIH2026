"""
backend/app/api/routes/alerts.py — P2

GET  /alerts                  list alerts (with optional hierarchy_id, node_id, resolved filter)
POST /alerts/{id}/resolve     mark an alert resolved
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.alert import Alert
from app.models.node import Node
from app.models.user import User
from app.schemas.alert import AlertRead

router = APIRouter()


@router.get("", response_model=list[AlertRead])
def list_alerts(
    hierarchy_id: UUID | None = None,
    node_id: UUID | None = None,
    resolved: bool | None = None,
    unresolved_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AlertRead]:
    stmt = select(Alert)

    if hierarchy_id:
        stmt = stmt.join(Node, Alert.node_id == Node.id).where(Node.hierarchy_id == hierarchy_id)
    elif node_id:
        stmt = stmt.where(Alert.node_id == node_id)

    if resolved is not None:
        stmt = stmt.where(Alert.resolved == resolved)
    elif unresolved_only:
        stmt = stmt.where(Alert.resolved.is_(False))

    stmt = stmt.order_by(Alert.created_at.desc())
    alerts = db.scalars(stmt).all()
    return [AlertRead.model_validate(a) for a in alerts]


@router.post("/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertRead:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.resolve(current_user.id)
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)
