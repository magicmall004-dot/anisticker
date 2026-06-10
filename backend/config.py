from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Telegram ──────────────────────────────────────────────
    BOT_TOKEN: str
    OWNER_TELEGRAM_ID: int = 1849257766

    # ── Supabase ──────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str         # service role – never expose to clients

    # ── JWT ───────────────────────────────────────────────────
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168       # 7 days

    # ── App ───────────────────────────────────────────────────
    FRONTEND_URL: str = "https://HtunHlaAung.github.io"
    ALLOWED_ORIGINS: list[str] = ["*"]
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
