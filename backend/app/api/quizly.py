from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse


router = APIRouter(prefix="/api/quizly", tags=["quizly"])


def _service(request: Request):
    return request.app.state.quizly_service


@router.get("/daily")
async def daily(request: Request, mode: str = "easy", lang: str = "en"):
    try:
        result = await _service(request).get_or_create_daily_puzzle(mode, lang)
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"error": "daily_generation_failed", "message": str(error)},
        )

    status_code = 202 if result.get("status") == "generating" else 200
    return JSONResponse(status_code=status_code, content=result)
