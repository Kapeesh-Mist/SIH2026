"""
backend/app/models/document.py — DOCUMENTS (ER diagram)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.embedding import Embedding
    from app.models.expense import Expense
    from app.models.node import Node


class Document(UUIDPKMixin, Base):
    __tablename__ = "documents"

    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expense_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=True, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)  # 'invoice', 'completion_certificate', ...
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # OCR + LLM extracted numbers
    verified_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    node: Mapped["Node"] = relationship(back_populates="documents")
    expense: Mapped["Expense | None"] = relationship(back_populates="documents")
    embeddings: Mapped[list["Embedding"]] = relationship(
        primaryjoin="and_(Embedding.ref_table=='documents', foreign(Embedding.ref_id)==Document.id)",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<Document {self.doc_type} node={self.node_id}>"
