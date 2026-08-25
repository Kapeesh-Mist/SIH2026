"""
Read-side schema for alerts. P2 owns api/routes/alerts.py but needs this
shape to serialize what P4's engine writes -- sharing it here so both
sides agree on the contract without a meeting.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.alert import AlertLayer, AlertSeverity


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    node_id: uuid.UUID
    layer: AlertLayer
    severity: AlertSeverity
    message: str
    details: dict
    source_table: str | None = None
    source_id: uuid.UUID | None = None
    escalated_to_node_id: uuid.UUID | None = None
    escalation_count: int
    resolved: bool
    resolved_by: uuid.UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime


class AlertResolve(BaseModel):
    resolution_note: str | None = None
