from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import Optional, Union, Any


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Project Info
    PROJECT_NAME: str = "Scouting Outing Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = False
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - will be parsed from string to list
    BACKEND_CORS_ORIGINS: Union[str, list[str]] = "http://localhost:3000,http://localhost:8000"
    
    @model_validator(mode='before')
    @classmethod
    def parse_cors(cls, data: Any) -> Any:
        """Parse CORS origins from comma-separated string"""
        if isinstance(data, dict) and 'BACKEND_CORS_ORIGINS' in data:
            origins = data['BACKEND_CORS_ORIGINS']
            if isinstance(origins, str):
                # Split by comma and clean up
                data['BACKEND_CORS_ORIGINS'] = [
                    origin.strip() for origin in origins.split(',') if origin.strip()
                ]
        return data
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construct DATABASE_URL if not provided
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()