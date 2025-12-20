from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration sourced from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="FinDash API", validation_alias="FINDASH_APP_NAME")
    environment: str = Field(default="development", validation_alias="FINDASH_ENV")
    version: str = Field(default="0.1.0", validation_alias="FINDASH_APP_VERSION")

    log_level: str = Field(default="INFO", validation_alias="FINDASH_LOG_LEVEL")

    database_url: str = Field(
        default="postgresql://findash:findash@db:5432/findash",
        validation_alias="DATABASE_URL",
    )

    jwt_secret_key: str = Field(default="change-me", validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    refresh_token_expire_days: int = Field(
        default=7,
        validation_alias="REFRESH_TOKEN_EXPIRE_DAYS",
    )
    allowed_origins: str = Field(
        default="http://localhost:3000",
        validation_alias="FINDASH_ALLOWED_ORIGINS",
    )

@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
