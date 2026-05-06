from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from .api.movly import router as movly_router
from .config import get_settings
from .database import lifespan


APP_FILES = {
    "index.html",
    "angly.html",
    "colory.html",
    "timely.html",
    "movly.html",
    "home.js",
    "angly.js",
    "colory.js",
    "timely.js",
    "movly.js",
    "styles.css",
    "site.webmanifest",
}


app = FastAPI(title="Daily Moris Games API", lifespan=lifespan)
app.include_router(movly_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def _safe_static_path(path: str) -> Path:
    settings = get_settings()
    static_root = settings.static_root.resolve()
    clean_path = "index.html" if path in {"", "/"} else path.lstrip("/")
    parts = Path(clean_path).parts

    if any(part.startswith(".") for part in parts):
        raise HTTPException(status_code=404, detail="Not found")
    if clean_path not in APP_FILES and not clean_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not found")

    candidate = (static_root / clean_path).resolve()
    if static_root not in candidate.parents and candidate != static_root:
        raise HTTPException(status_code=404, detail="Not found")
    if not candidate.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return candidate


@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(_safe_static_path("index.html"))


@app.get("/{path:path}", include_in_schema=False)
async def static_files(path: str):
    return FileResponse(_safe_static_path(path))
