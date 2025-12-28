"""
Configuration management for the A2A Host backend.
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # JWT Configuration
    # WARNING: Change this in production!
    secret_key: str = "dev-secret-key-change-in-production" 
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # LLM Configuration
    # gemini_api_key is required for Gemini models
    gemini_api_key: Optional[str] = None
    
    # Cohere Configuration
    cohere_api_key: Optional[str] = None
    
    # Azure Configuration
    azure_api_key: Optional[str] = None
    azure_api_base: Optional[str] = None
    azure_api_version: Optional[str] = "2024-02-15-preview"
    azure_deployment: Optional[str] = None
    
    # Default Model (Cohere)
    llm_model: str = "cohere/command-a-03-2025"
    
    # A2UI Generation
    use_llm_for_a2ui: bool = True
    a2ui_generation_model: str = "cohere/command-a-03-2025"
    
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
        extra = "ignore"


# Global settings instance
settings = Settings()
