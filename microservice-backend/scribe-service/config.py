from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    rabbitmq_enabled: bool = False
    rabbitmq_url: str = "amqp://localhost:5672"
    redis_url: str = "redis://redis:6379/0"
    openai_api_key: str
    ai_model_version: str = "gpt-4o"
    transcription_diarize_model: str = "gpt-4o-transcribe-diarize"
    transcription_segment_model: str = "whisper-1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    debug_mode: bool = False
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()