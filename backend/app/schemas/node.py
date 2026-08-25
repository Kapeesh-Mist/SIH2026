"""
backend/app/schemas/node.py — P1
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class NodeCreationRequestCreate(BaseModel):
    parent_id: UUID
    template_category: str | None = None
    justification_text: str = Field(min_length=1)
    allocated_budget: Decimal = Field(gt=0)
    role: str


class NodeCreationRequestRead(BaseModel):
    id: UUID
    parent_id: UUID
    requested_by: UUID
    template_category: str | None
    justification_text: str
    status: str
    approver_ids: list | None
    decided_at: datetime | None

    class Config:
        from_attributes = True


class NodeRead(BaseModel):
    id: UUID
    hierarchy_id: UUID
    parent_id: UUID | None
    path: str
    user_id: UUID
    role: str
    allocated_budget: Decimal
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class NodeApprovalDecision(BaseModel):
    approve: bool
    reason: str | None = None  # required in practice when approve=False, enforced in the route
