from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017"
    db_name: str = "uaifix"
    secret_key: str = "dev-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 dias
    admin_email: str = "admin@uaifix.com.br"
    admin_password: str = "admin123"
    uploads_dir: str = "uploads"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    class Config:
        env_file = ".env"


settings = Settings()
