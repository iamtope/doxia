from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    rabbitmq_url: str
    redis_url: str = "redis://redis:6379/0"
    openai_api_key: str
    ai_model_version: str = "gpt-4o"
    debug_mode: bool = False
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()