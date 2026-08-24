"""
backend/app/models/expense.py — EXPENSES (ER diagram)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.document import Document
    from app.models.node import Node
    from app.models.roadmap_version import RoadmapVersion


class Expense(UUIDPKMixin, Base):
    __tablename__ = "expenses"
    __table_args__ = (CheckConstraint("amount >= 0", name="ck_expenses_amount_nonneg"),)

    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), nullable=False)
    progress_value: Mapped[Decimal | None] = mapped_column(Numeric(16, 2), nullable=True)
    progress_unit: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'percent', 'km', 'units'
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending_review")
    # status in ('pending_review', 'verified', 'rejected')
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    node: Mapped["Node"] = relationship(back_populates="expenses")
    documents: Mapped[list["Document"]] = relationship(back_populates="expense", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="expense")

    def compute_variance(self, roadmap: "RoadmapVersion") -> float | None:
        """Expenditure-vs-progress ratio deviation against the roadmap's
        expected ratio for this category (Layer 1). Returns None if the
        roadmap has no baseline for this category yet."""
        expected = roadmap.extracted_json.get("categories", {}).get(self.category)
        if not expected or not self.progress_value:
            return None
        expected_ratio = expected.get("amount", 0) / max(expected.get("expected_progress", 1), 1)
        actual_ratio = float(self.amount) / float(self.progress_value)
        if expected_ratio == 0:
            return None
        return (actual_ratio - expected_ratio) / expected_ratio

    def __repr__(self) -> str:
        return f"<Expense {self.category} amount={self.amount}>"