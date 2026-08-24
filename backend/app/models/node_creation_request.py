"""
backend/app/models/node_creation_request.py — NODE_CREATION_REQUESTS (ER diagram)

Layer 0 (node legitimacy at creation) lives here: every new node starts as
a request with a justification, gets checked against the roadmap's expected
range, and is either auto-approved or routed to the two nodes directly
above the parent.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.node import Node


class NodeCreationRequest(UUIDPKMixin, Base):
    __tablename__ = "node_creation_requests"

    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    template_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    justification_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    # status in ('pending', 'auto_approved', 'approved', 'rejected')
    approver_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # relationships
    parent_node: Mapped["Node"] = relationship(back_populates="creation_requests", foreign_keys=[parent_id])

    def __repr__(self) -> str:
        return f"<NodeCreationRequest parent={self.parent_id} status={self.status}>"