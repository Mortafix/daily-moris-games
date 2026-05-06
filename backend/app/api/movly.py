from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/movly", tags=["movly"])


class GuessInput(BaseModel):
    tmdb_id: int | None = Field(default=None, alias="tmdbId")
    id: int | None = None
    skip: bool = False
    title: str | None = None
    query: str | None = None

    model_config = {"populate_by_name": True}


class GuessRequest(BaseModel):
    pool: str = "best"
    date: str | None = None
    lang: str = "en"
    attempt_number: int = Field(default=1, alias="attemptNumber")
    guess: GuessInput = Field(default_factory=GuessInput)

    model_config = {"populate_by_name": True}


def _service(request: Request):
    return request.app.state.movly_service


@router.get("/daily")
async def daily(request: Request, pool: str = "best", lang: str = "en"):
    try:
        result = await _service(request).get_or_create_daily_puzzle(pool, lang)
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"error": "daily_generation_failed", "message": str(error)},
        )

    status_code = 202 if result.get("status") == "generating" else 200
    return JSONResponse(status_code=status_code, content=result)


@router.get("/search")
async def search(request: Request, q: str = "", lang: str = "en"):
    try:
        results = await _service(request).search_movies(q, lang)
        return {"results": results}
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"error": "search_failed", "message": str(error)},
        )


@router.post("/guess")
async def guess(request: Request, payload: GuessRequest):
    body: dict[str, Any] = payload.model_dump(by_alias=True)
    status_code, result = await _service(request).submit_guess(
        body["pool"],
        body["lang"],
        body["attemptNumber"],
        body["guess"],
    )
    return JSONResponse(status_code=status_code, content=result)
