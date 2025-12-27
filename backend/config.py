"""
Configuration management for the A2A Host backend.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # JWT Configuration
    # WARNING: Change this in production!
    secret_key: str = "dev-secret-key-change-in-production" 
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # LLM Configuration
    # gemini_api_key is required, no default
    gemini_api_key: str 
    llm_model: str = "gemini-2.0-flash-exp"
    
    # File Storage
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    
    # Remote Agent Endpoints
    remote_agent_url: str = "http://localhost:8001"
    
    # CORS Settings
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
