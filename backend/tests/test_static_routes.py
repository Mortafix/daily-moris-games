from pathlib import Path

import pytest
from fastapi import HTTPException

from backend.app import main


class DummySettings:
    static_root = Path(__file__).resolve().parents[2]


@pytest.fixture(autouse=True)
def static_root(monkeypatch):
    monkeypatch.setattr(main, "get_settings", lambda: DummySettings())


def relative_static_path(path: str) -> str:
    return main._safe_static_path(path).relative_to(DummySettings.static_root).as_posix()


def test_pretty_routes_resolve_to_frontend_pages():
    assert relative_static_path("") == "frontend/pages/index.html"
    assert relative_static_path("angly") == "frontend/pages/angly.html"
    assert relative_static_path("movly/") == "frontend/pages/movly.html"


def test_legacy_static_routes_still_work():
    assert relative_static_path("movly.html") == "frontend/pages/movly.html"
    assert relative_static_path("movly.js") == "frontend/scripts/movly.js"
    assert relative_static_path("styles.css") == "frontend/styles/styles.css"


def test_public_static_directories_resolve():
    assert relative_static_path("scripts/home.js") == "frontend/scripts/home.js"
    assert relative_static_path("styles/styles.css") == "frontend/styles/styles.css"
    assert relative_static_path("assets/movly-icon.png") == "frontend/assets/movly-icon.png"
    assert relative_static_path("site.webmanifest") == "frontend/site.webmanifest"


def test_pages_directory_is_not_publicly_browsable():
    with pytest.raises(HTTPException):
        main._safe_static_path("pages/movly.html")
