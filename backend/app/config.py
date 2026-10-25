import os
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

# Load .env file from backend root
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediFlow AI — Smart Healthcare Follow-up Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mediflow.db")
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Automation / n8n Webhook
    N8N_DEFAULT_WEBHOOK_URL: str = os.getenv("N8N_DEFAULT_WEBHOOK_URL", "https://n8n.mediflow-demo.internal/webhook/healthcare-followup")
    SIMULATION_MODE_DEFAULT: bool = os.getenv("SIMULATION_MODE_DEFAULT", "True").lower() in ("true", "1", "t")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    @property
    def has_gemini_key(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 5)

    class Config:
        case_sensitive = True

settings = Settings()
