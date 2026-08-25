"""
backend/app/models/hierarchy.py — HIERARCHIES (ER diagram)
"""

from __future__ import annotations

from typing import TYPE_CHECKING
import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.node import Node
    from app.models.roadmap_version import RoadmapVersion


class Hierarchy(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "hierarchies"
    __table_args__ = (CheckConstraint("initial_budget >= 0", name="ck_hierarchies_budget_nonneg"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    initial_budget: Mapped[Decimal] = mapped_column(Numeric(16, 2), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ongoing")
    # status in ('ongoing', 'completed', 'archived') — enforced at DB level via CHECK in schema.sql / migration

    # relationships
    owner: Mapped["User"] = relationship(back_populates="owned_hierarchies", foreign_keys=[owner_id])
    nodes: Mapped[list["Node"]] = relationship(back_populates="hierarchy", cascade="all, delete-orphan")
    roadmap_versions: Mapped[list["RoadmapVersion"]] = relationship(
        back_populates="hierarchy", cascade="all, delete-orphan", order_by="RoadmapVersion.version_no"
    )

    def __repr__(self) -> str:
        return f"<Hierarchy {self.name}>"
