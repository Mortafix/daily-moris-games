from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from .api.movly import router as movly_router
from .config import get_settings
from .database import lifespan


PRETTY_ROUTES = {
    "": "pages/index.html",
    "index": "pages/index.html",
    "angly": "pages/angly.html",
    "colory": "pages/colory.html",
    "timely": "pages/timely.html",
    "movly": "pages/movly.html",
}

LEGACY_ROUTES = {
    "index.html": "pages/index.html",
    "angly.html": "pages/angly.html",
    "colory.html": "pages/colory.html",
    "timely.html": "pages/timely.html",
    "movly.html": "pages/movly.html",
    "home.js": "scripts/home.js",
    "angly.js": "scripts/angly.js",
    "colory.js": "scripts/colory.js",
    "timely.js": "scripts/timely.js",
    "movly.js": "scripts/movly.js",
    "styles.css": "styles/styles.css",
    "site.webmanifest": "site.webmanifest",
}

STATIC_PREFIXES = ("assets/", "scripts/", "styles/")


app = FastAPI(title="Daily Moris Games API", lifespan=lifespan)
app.include_router(movly_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def _safe_static_path(path: str) -> Path:
    settings = get_settings()
    static_root = settings.static_root.resolve()
    frontend_root = (
        static_root if (static_root / "pages").is_dir() else static_root / "frontend"
    )
    requested_path = path.strip("/")
    is_page_route = requested_path in PRETTY_ROUTES or requested_path in LEGACY_ROUTES
    clean_path = PRETTY_ROUTES.get(
        requested_path,
        LEGACY_ROUTES.get(requested_path, requested_path),
    )
    parts = Path(clean_path).parts

    if any(part.startswith(".") for part in parts):
        raise HTTPException(status_code=404, detail="Not found")
    is_static_file = clean_path == "site.webmanifest" or clean_path.startswith(
        STATIC_PREFIXES
    )
    if not is_page_route and not is_static_file:
        raise HTTPException(status_code=404, detail="Not found")

    candidate = (frontend_root / clean_path).resolve()
    if frontend_root not in candidate.parents and candidate != frontend_root:
        raise HTTPException(status_code=404, detail="Not found")
    if not candidate.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return candidate


@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(_safe_static_path(""))


@app.get("/{path:path}", include_in_schema=False)
async def static_files(path: str):
    return FileResponse(_safe_static_path(path))
