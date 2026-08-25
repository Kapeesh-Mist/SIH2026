"""
backend/app/models/embedding.py — EMBEDDINGS (ER diagram)

Backs Layer 3 duplicate/near-duplicate detection (invoice text similarity,
ghost-worker name variants) via pgvector cosine similarity.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPKMixin

EMBEDDING_DIM = 384  # matches sentence-transformers/all-MiniLM-L6-v2 — keep in sync with app/config.py


class Embedding(UUIDPKMixin, Base):
    __tablename__ = "embeddings"

    ref_table: Mapped[str] = mapped_column(String(50), nullable=False)  # 'documents', 'expenses', ...
    ref_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    embedding_vector: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Embedding {self.ref_table}:{self.ref_id}>"
