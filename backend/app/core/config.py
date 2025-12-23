"""Application configuration using Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "Universal SOP Architect"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres123@192.168.31.71:5432/sop_architect"
    database_url_sync: str = "postgresql://postgres:postgres123@192.168.31.71:5432/sop_architect"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # File Upload
    upload_dir: str = "uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB

    # LLM Configuration (OpenAI-compatible API)
    llm_enabled: bool = True
    llm_provider: str = "chatglm"  # chatglm, openai, or custom name
    llm_api_base: str = "http://localhost:8080/v1"
    llm_api_key: str = ""
    llm_model: str = "glm-4-flash"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
