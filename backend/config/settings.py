from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:password@localhost:5432/complaint_qms"
    groq_api_key: str = ""
    groq_model: str = "gemma2-9b-it"
    frontend_url: str = "http://localhost:5173"
    app_env: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
