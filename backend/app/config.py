from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent


def _load_env_files() -> None:
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / ".env.local")
    load_dotenv(BACKEND_ROOT / ".env")
    load_dotenv(BACKEND_ROOT / ".env.local")


def _resolve_static_root(value: str | None) -> Path:
    if not value:
        return PROJECT_ROOT
    path = Path(value)
    if path.is_absolute():
        return path
    return (BACKEND_ROOT / path).resolve()


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str
    mongodb_db: str
    tmdb_bearer_token: str
    openai_api_key: str
    openai_emoji_model: str
    static_root: Path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_env_files()
    return Settings(
        mongodb_uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
        mongodb_db=os.getenv("MONGODB_DB", "daily_moris_games"),
        tmdb_bearer_token=os.getenv("TMDB_BEARER_TOKEN", ""),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_emoji_model=os.getenv("OPENAI_EMOJI_MODEL", "gpt-4.1-mini"),
        static_root=_resolve_static_root(os.getenv("STATIC_ROOT")),
    )
