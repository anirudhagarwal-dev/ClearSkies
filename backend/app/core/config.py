import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AirTrack"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("AIRTRACK_SECRET_KEY", "airtrack-super-secure-jwt-secret-key-2026-cpcb")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Environment & Demo Mode
    AIRTRACK_DEMO_MODE: bool = os.getenv("AIRTRACK_DEMO_MODE", "true").lower() in ("true", "1", "yes")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./airtrack.db")
    
    # External API Keys (OpenAQ v3)
    OPENAQ_API_KEY: str = os.getenv("OPENAQ_API_KEY", "")
    
    # Freshness threshold (hours)
    FRESHNESS_THRESHOLD_HOURS: int = 3
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
