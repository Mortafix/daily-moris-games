from __future__ import annotations

import inspect
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pymongo import ASCENDING

try:
    from pymongo import AsyncMongoClient
except ImportError:  # pragma: no cover - older PyMongo async import path.
    from pymongo.asynchronous import AsyncMongoClient

from .config import get_settings
from .services.movly import MovlyService
from .services.quizly import QuizlyService


async def ensure_indexes(db) -> None:
    await db.movly_puzzles.create_index(
        [("date", ASCENDING), ("pool", ASCENDING)],
        unique=True,
        name="movly_daily_unique",
    )
    await db.movly_movie_cache.create_index(
        [("tmdbId", ASCENDING)],
        unique=True,
        name="movly_movie_tmdb_unique",
    )
    await db.quizly_puzzles.create_index(
        [("date", ASCENDING), ("mode", ASCENDING)],
        unique=True,
        name="quizly_daily_unique",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    client = AsyncMongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    await ensure_indexes(db)

    app.state.settings = settings
    app.state.mongo_client = client
    app.state.mongo_db = db
    app.state.movly_service = MovlyService(settings, db)
    app.state.quizly_service = QuizlyService(settings, db)

    try:
        yield
    finally:
        close_result = client.close()
        if inspect.isawaitable(close_result):
            await close_result
