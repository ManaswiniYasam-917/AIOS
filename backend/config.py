import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AIOS Central Controller"
    VERSION: str = "v1.0.0"
    ENVIRONMENT: str = Field(default="development", validation_alias="ENV")
    
    # Database Settings
    DATABASE_URL: str = Field(default="sqlite:///./aios.db")
    PRISMA_DATABASE_URL: str = Field(
        default="postgresql://aios_admin:secure_aios_db_pass@localhost:5432/aios_db"
    )
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # Vector DB & Knowledge Graph Settings
    QDRANT_URL: str = Field(default="http://localhost:6333")
    NEO4J_URL: str = Field(default="bolt://localhost:7687")
    NEO4J_USER: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(default="password")
    
    # Security Settings
    JWT_SECRET_KEY: str = Field(default="aios_super_secret_cryptographic_signing_key_987654321")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours
    AES_SECRET_KEY: str = Field(default="sixteen_byte_key1")  # Must be 16, 24 or 32 bytes for AES
    
    # MQTT Settings
    MQTT_BROKER: str = Field(default="localhost")
    MQTT_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = Field(default="aios/edge")
    
    # gRPC Settings
    GRPC_PORT: int = 50051
    
    # AI API Keys
    GEMINI_API_KEY: str = Field(default="MY_GEMINI_API_KEY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
