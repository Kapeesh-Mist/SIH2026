"""
backend/app/models/user.py — USERS (ER diagram)
"""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin


class User(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    aadhaar_ref: Mapped[str | None] = mapped_column(String(20), nullable=True)  # masked reference only
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # relationships
    owned_hierarchies: Mapped[list["Hierarchy"]] = relationship(
        back_populates="owner", foreign_keys="Hierarchy.owner_id"
    )
    nodes: Mapped[list["Node"]] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
