"""
backend/app/models/alert.py — ALERTS (ER diagram)
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.expense import Expense
    from app.models.node import Node


class Alert(UUIDPKMixin, Base):
    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("severity IN ('info', 'warning', 'critical')", name="ck_alerts_severity"),
    )

    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expense_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=True
    )
    layer: Mapped[str] = mapped_column(String(30), nullable=False)  # 'layer0' .. 'layer4'
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    escalated_to_node_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id"), nullable=True
    )
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    node: Mapped["Node"] = relationship(back_populates="alerts", foreign_keys=[node_id])
    expense: Mapped["Expense | None"] = relationship(back_populates="alerts")

    def escalate(self, next_ancestor_id: uuid.UUID) -> None:
        """Move escalated_to_node_id up to the next ancestor; called by the
        alert-escalation scheduler for unresolved/high-severity alerts."""
        self.escalated_to_node_id = next_ancestor_id

    def resolve(self, user_id: uuid.UUID) -> None:
        self.resolved = True

    def __repr__(self) -> str:
        return f"<Alert {self.layer} severity={self.severity} resolved={self.resolved}>"