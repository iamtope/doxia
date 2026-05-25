from pydantic_settings import BaseSettings, SettingsConfigDict


def _is_loopback_url(url: str) -> bool:
    u = (url or "").lower()
    return "localhost" in u or "127.0.0.1" in u


def _is_placeholder_redis_url(url: str) -> bool:
    """Docker Compose default; not a real broker on Fly."""
    u = (url or "").lower()
    return u.startswith("redis://redis:") or u == "redis://redis"


class Settings(BaseSettings):
    rabbitmq_enabled: bool = False
    rabbitmq_url: str = "amqp://localhost:5672"
    redis_url: str = "redis://redis:6379/0"
    openai_api_key: str

    @property
    def use_redis(self) -> bool:
        return (
            bool(self.redis_url)
            and not _is_loopback_url(self.redis_url)
            and not _is_placeholder_redis_url(self.redis_url)
        )

    @property
    def use_rabbitmq(self) -> bool:
        return (
            self.rabbitmq_enabled
            and bool(self.rabbitmq_url)
            and not _is_loopback_url(self.rabbitmq_url)
        )
    ai_model_version: str = "gpt-4o"
    transcription_diarize_model: str = "gpt-4o-transcribe-diarize"
    transcription_segment_model: str = "whisper-1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    debug_mode: bool = False
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()