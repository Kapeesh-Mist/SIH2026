"""
backend/app/db/session.py — SQLAlchemy engine/session

One engine per process; a scoped session factory; a `get_db` FastAPI
dependency that yields a session and always closes it.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # avoids stale-connection errors after idle periods
    echo=(settings.environment == "development"),
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: `db: Session = Depends(get_db)`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()