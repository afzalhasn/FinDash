from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration sourced from environment variables."""

    app_name: str = Field(default="FinDash API", env="FINDASH_APP_NAME")
    environment: str = Field(default="development", env="FINDASH_ENV")
    version: str = Field(default="0.1.0", env="FINDASH_APP_VERSION")

    log_level: str = Field(default="INFO", env="FINDASH_LOG_LEVEL")

    database_url: str = Field(
        default="postgresql://findash:findash@db:5432/findash",
        env="DATABASE_URL",
    )

    jwt_secret_key: str = Field(default="change-me", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
