"""
backend/app/schemas/alert.py — P2
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AlertRead(BaseModel):
    id: UUID
    node_id: UUID
    expense_id: UUID | None
    layer: str
    severity: str
    message: str
    escalated_to_node_id: UUID | None
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True
