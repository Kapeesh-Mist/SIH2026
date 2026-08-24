"""
backend/app/models/base.py — declarative base + shared mixins

Every model in this package inherits from `Base`. `UUIDPKMixin` and
`TimestampMixin` factor out the id/created_at columns that appear on
every table in the ER diagram, so each model file only declares what's
actually distinct about that entity.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UUIDPKMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )