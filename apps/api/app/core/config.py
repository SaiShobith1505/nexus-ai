from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Nexus AI API"
    environment: str = "development"
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = Field(min_length=16)
    jwt_issuer: str = "nexus-ai"
    access_token_expire_minutes: int = 60
    frontend_url: AnyHttpUrl | str = "http://localhost:3000"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_id: str | None = None
    marketplace_commission_bps: int = 1500


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
