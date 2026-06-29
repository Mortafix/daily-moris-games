from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.quizly import router


class FakeQuizlyService:
    async def get_or_create_daily_puzzle(self, mode, lang):
        return {
            "status": "ready",
            "puzzle": {
                "version": 1,
                "date": "2026-06-26",
                "mode": mode,
                "lang": lang,
                "questions": [
                    {
                        "id": "easy-0-0",
                        "category": "General Knowledge",
                        "difficulty": "easy",
                        "question": "Which answer is correct?",
                        "answers": [
                            {"id": "easy-0-0:wrong-0", "text": "No"},
                            {"id": "easy-0-0:correct", "text": "Yes"},
                        ],
                        "correctAnswerId": "easy-0-0:correct",
                    }
                ],
            },
        }


class GeneratingQuizlyService:
    async def get_or_create_daily_puzzle(self, mode, lang):
        return {"status": "generating", "date": "2026-06-26", "mode": mode}


def make_client(service=None):
    app = FastAPI()
    app.include_router(router)
    app.state.quizly_service = service or FakeQuizlyService()
    return TestClient(app)


def test_daily_endpoint_returns_ready_puzzle():
    response = make_client().get("/api/quizly/daily?mode=hard&lang=it")

    payload = response.json()
    assert response.status_code == 200
    assert payload["puzzle"]["mode"] == "hard"
    assert payload["puzzle"]["lang"] == "it"
    assert payload["puzzle"]["questions"][0]["correctAnswerId"] == "easy-0-0:correct"


def test_daily_endpoint_returns_accepted_while_generating():
    response = make_client(GeneratingQuizlyService()).get("/api/quizly/daily?mode=easy")

    assert response.status_code == 202
    assert response.json()["status"] == "generating"
