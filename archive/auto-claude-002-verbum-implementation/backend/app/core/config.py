from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./verbum.db"

    # Anthropic Claude API
    anthropic_api_key: Optional[str] = None

    # OpenAI ChatGPT API
    openai_api_key: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
