"""FastAPI Route Dependencies."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db_session
from app.config import settings, Settings


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session."""
    async for session in get_db_session():
        yield session


def get_settings() -> Settings:
    """Dependency for obtaining application settings."""
    return settings
