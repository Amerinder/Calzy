from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Calzy API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # External Nutrition APIs
    FATSECRET_CLIENT_ID: str = ""
    FATSECRET_CLIENT_SECRET: str = ""
    USDA_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env"],
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
