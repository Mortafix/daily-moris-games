from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.movly import router


class FakeMovlyService:
    async def get_or_create_daily_puzzle(self, pool, lang):
        return {
            "status": "ready",
            "puzzle": {
                "version": 1,
                "date": "2026-05-06",
                "pool": pool,
                "levels": ["🚢 ❤️", "🚢 ❤️ 🌊", "🚢 ❤️ 🌊 🧊", "🚢 ❤️ 🌊 🧊 🎻", "🚢 ❤️ 🌊 🧊 🎻 💎"],
            },
        }

    async def search_movies(self, query, lang):
        return [{"id": 597, "title": "Titanic", "year": 1997, "posterUrl": ""}]

    async def submit_guess(self, pool, lang, attempt_number, guess):
        if guess.get("skip"):
            return 200, {
                "valid": True,
                "correct": False,
                "finalAttempt": attempt_number >= 5,
                "skipped": True,
                "feedback": {"type": "", "message": "", "yearDirection": ""},
                "guess": {"skip": True},
                "answer": {"id": 597, "title": "Titanic", "year": 1997, "posterUrl": ""}
                if attempt_number >= 5
                else None,
            }
        correct = guess.get("tmdbId") == 597
        return 200, {
            "valid": True,
            "correct": correct,
            "finalAttempt": attempt_number >= 5,
            "feedback": {"type": "", "message": "", "yearDirection": ""},
            "guess": {"id": 597, "title": "Titanic", "year": 1997, "posterUrl": ""},
            "answer": {"id": 597, "title": "Titanic", "year": 1997, "posterUrl": ""} if correct else None,
        }


def make_client():
    app = FastAPI()
    app.include_router(router)
    app.state.movly_service = FakeMovlyService()
    return TestClient(app)


def test_daily_endpoint_returns_ready_puzzle():
    response = make_client().get("/api/movly/daily?pool=best&lang=it")

    assert response.status_code == 200
    assert response.json()["puzzle"]["levels"][0] == "🚢 ❤️"


def test_search_endpoint_returns_suggestions():
    response = make_client().get("/api/movly/search?q=titanic&lang=it")

    assert response.status_code == 200
    assert response.json()["results"][0]["title"] == "Titanic"


def test_guess_endpoint_returns_win():
    response = make_client().post(
        "/api/movly/guess",
        json={
            "pool": "best",
            "lang": "it",
            "attemptNumber": 1,
            "guess": {"tmdbId": 597, "title": "Titanic"},
        },
    )

    assert response.status_code == 200
    assert response.json()["correct"] is True


def test_guess_endpoint_supports_final_skip():
    response = make_client().post(
        "/api/movly/guess",
        json={
            "pool": "best",
            "lang": "it",
            "attemptNumber": 5,
            "guess": {"skip": True},
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["skipped"] is True
    assert payload["finalAttempt"] is True
    assert payload["answer"]["title"] == "Titanic"
