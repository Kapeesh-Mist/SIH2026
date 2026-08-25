"""
backend/app/models/node.py — NODES (ER diagram)

The tree itself. `parent_id` is self-referential; `path` mirrors Postgres's
ltree column (see schema.sql) so subtree queries stay fast at scale. The
cumulative budget-split rule (sum of a node's children's allocations must
never exceed the node's own allocation) is enforced as a DB trigger in
schema.sql — `validate_budget_split` here is the same check done in Python
for pre-flight validation before hitting the DB.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.document import Document
    from app.models.expense import Expense
    from app.models.hierarchy import Hierarchy
    from app.models.node_creation_request import NodeCreationRequest
    from app.models.user import User


class LtreeType(TypeDecorator):
    """Minimal mapping for Postgres's ltree type (stored/compared as text
    on the Python side). For production, prefer sqlalchemy-utils.LtreeType,
    which adds ltree-aware comparator operators (descendant_of, etc.)."""

    impl = String
    cache_ok = True


class Node(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "nodes"
    __table_args__ = (CheckConstraint("allocated_budget >= 0", name="ck_nodes_budget_nonneg"),)

    hierarchy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hierarchies.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True
    )
    path: Mapped[str] = mapped_column(LtreeType, nullable=False)  # e.g. "root.district1.contractor3"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)  # 'district', 'contractor', 'worker', ...
    allocated_budget: Mapped[Decimal] = mapped_column(Numeric(16, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    # status in ('pending', 'active', 'suspended')

    # relationships
    hierarchy: Mapped["Hierarchy"] = relationship(back_populates="nodes")
    user: Mapped["User"] = relationship(back_populates="nodes")
    parent: Mapped["Node | None"] = relationship(remote_side="Node.id", back_populates="children")
    children: Mapped[list["Node"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    creation_requests: Mapped[list["NodeCreationRequest"]] = relationship(
        back_populates="parent_node", foreign_keys="NodeCreationRequest.parent_id"
    )
    expenses: Mapped[list["Expense"]] = relationship(back_populates="node", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="node", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="node", foreign_keys="Alert.node_id", cascade="all, delete-orphan"
    )

    # ---- domain behaviour (mirrors class_diagram.mmd) ----

    def validate_budget_split(self, db: Session, amount: Decimal) -> bool:
        """True if (sum of existing children's allocations + amount) does
        not exceed this node's own allocated_budget. The DB trigger in
        schema.sql is the source of truth; this lets the API return a clean
        400 before attempting the insert."""
        siblings_total = sum((child.allocated_budget for child in self.children), Decimal("0"))
        return (siblings_total + amount) <= self.allocated_budget

    def get_ancestors(self, db: Session) -> list["Node"]:
        """Walk parent_id up to the root. For large trees, prefer a single
        ltree query (`path @> :this_path` equivalent) over N lookups."""
        ancestors: list[Node] = []
        current = self
        while current.parent_id is not None:
            current = db.get(Node, current.parent_id)
            if current is None:
                break
            ancestors.append(current)
        return ancestors

    def __repr__(self) -> str:
        return f"<Node {self.role} path={self.path}>"
