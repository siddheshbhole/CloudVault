from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    SUPABASE_URL: str = "https://example.supabase.co"
    SUPABASE_SECRET_KEY: str = "example-secret-key"
    SUPABASE_BUCKET: str = "cloudvault-blocks"

    # 32-byte key encoded in Base64 for AES-256
    CLOUDVAULT_MASTER_KEY_B64: str = "dGhpcy1pcy1hLXRlc3QtMzItYnl0ZS1rZXktMTIzNDU2Nzg="

    MAX_UPLOAD_SIZE_BYTES: int = 104857600  # 100 MiB
    CHUNK_SIZE_BYTES: int = 1048576         # 1 MiB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
