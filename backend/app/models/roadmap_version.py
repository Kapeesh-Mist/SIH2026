"""
backend/app/models/roadmap_version.py — ROADMAP_VERSIONS (ER diagram)

Append-only baseline log: never update a row in place, always insert a new
version_no when the roadmap changes (see the "master text" doc, Section 5).
"""

from __future__ import annotations

from typing import TYPE_CHECKING
import uuid

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.hierarchy import Hierarchy


class RoadmapVersion(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "roadmap_versions"
    __table_args__ = (UniqueConstraint("hierarchy_id", "version_no", name="uq_roadmap_hierarchy_version"),)

    hierarchy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hierarchies.id", ondelete="CASCADE"), nullable=False
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    extracted_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # relationships
    hierarchy: Mapped["Hierarchy"] = relationship(back_populates="roadmap_versions")

    def get_expected_range(self, category: str) -> tuple[float, float] | None:
        """Read the expected (min, max) for a template category out of
        extracted_json — used by NodeCreationRequest.check_against_quota."""
        return (self.extracted_json.get("categories", {}).get(category, {}) or {}).get("expected_range")

    def __repr__(self) -> str:
        return f"<RoadmapVersion hierarchy={self.hierarchy_id} v{self.version_no}>"
