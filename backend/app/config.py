"""
backend/app/config.py — env/config loading

Centralized settings object, read once at import time from environment
variables / a .env file. Every other module imports `settings` from here
instead of calling os.environ directly.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database ---
    database_url: str = "postgresql+psycopg://user:password@localhost:5432/sih26102"

    # --- Auth ---
    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # --- LLM / AI services ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.1-70b-instruct"
    llm_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"
    embedding_model: str = "all-MiniLM-L6-v2"  # sentence-transformers, 384 dims (matches embeddings.embedding_vector)

    # --- File storage ---
    storage_bucket_url: str = ""
    storage_api_key: str = ""

    # --- App ---
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() is only constructed once per process."""
    return Settings()


settings = get_settings()
