"""
backend/app/config.py — env/config loading

Centralized settings object, read once at import time from environment
variables / a .env file. Every other module imports `settings` from here
instead of calling os.environ directly.
"""
# backend/app/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database ---
    database_url: str

    # --- Auth ---
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int

    # --- LLM / AI services ---
    llm_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"
    embedding_model: str = "all-MiniLM-L6-v2"

    # --- File storage ---
    storage_bucket_url: str = ""
    storage_api_key: str = ""

    # --- App ---
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() is only constructed once per process."""
    return Settings()


settings = get_settings()
