import random

import pytest

from backend.app.services import quizly
from backend.app.services.quizly import (
    QuizlyService,
    normalize_question,
    validate_translation,
)


def raw_question(difficulty, index):
    return {
        "type": "multiple",
        "difficulty": difficulty,
        "category": "Science &amp; Nature",
        "question": f"What is &quot;Q{index}&quot;?",
        "correct_answer": "Water &amp; ice",
        "incorrect_answers": ["Fire", "Air", "Earth"],
    }


class DummyDb:
    quizly_puzzles = None


class RecordingQuizlyService(QuizlyService):
    def __init__(self):
        super().__init__(None, DummyDb())
        self.calls = []

    async def _fetch_questions(self, amount, difficulty):
        self.calls.append((amount, difficulty))
        return [raw_question(difficulty, index) for index in range(amount)]


@pytest.mark.asyncio
async def test_easy_generation_fetches_three_easy_questions_with_one_call():
    service = RecordingQuizlyService()

    puzzle = await service._generate_puzzle("easy", "2026-06-26")

    assert service.calls == [(3, "easy")]
    assert len(puzzle["questions"]) == 3
    assert {question["difficulty"] for question in puzzle["questions"]} == {"easy"}
    assert puzzle["sourceDifficulty"] == "easy"
    assert puzzle["translations"] == {}


@pytest.mark.asyncio
async def test_hard_generation_fetches_three_hard_questions():
    service = RecordingQuizlyService()

    puzzle = await service._generate_puzzle("hard", "2026-06-26")

    assert service.calls == [(3, "hard")]
    assert len(puzzle["questions"]) == 3
    assert {question["difficulty"] for question in puzzle["questions"]} == {"hard"}


def test_normalize_question_decodes_html_and_returns_shuffled_answer_shape():
    question = normalize_question(raw_question("easy", 1), random.Random(4), "q1")

    assert question["category"] == "Science & Nature"
    assert question["question"] == 'What is "Q1"?'
    assert {answer["text"] for answer in question["answers"]} == {
        "Water & ice",
        "Fire",
        "Air",
        "Earth",
    }
    assert question["correctAnswerId"] in {answer["id"] for answer in question["answers"]}


@pytest.mark.asyncio
async def test_fetch_questions_raises_when_opentdb_response_code_is_not_zero():
    class FailingQuizlyService(QuizlyService):
        async def _opentdb_fetch(self, url, params):
            return {"response_code": 1, "results": []}

    service = FailingQuizlyService(None, DummyDb())

    with pytest.raises(RuntimeError, match="No results"):
        await service._fetch_questions(5, "hard")


@pytest.mark.asyncio
async def test_fetch_questions_retries_after_opentdb_rate_limit(monkeypatch):
    sleeps = []
    clock = [100.0]

    async def fake_sleep(seconds):
        sleeps.append(seconds)
        clock[0] += seconds

    class RateLimitedQuizlyService(QuizlyService):
        def __init__(self):
            super().__init__(None, DummyDb())
            self.calls = 0

        async def _opentdb_fetch(self, url, params):
            self.calls += 1
            if self.calls == 1:
                return {"response_code": 5, "results": []}
            return {"response_code": 0, "results": [raw_question("medium", 1)]}

    monkeypatch.setattr(quizly.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(quizly.time, "monotonic", lambda: clock[0])
    service = RateLimitedQuizlyService()

    questions = await service._fetch_questions(1, "medium")

    assert len(questions) == 1
    assert service.calls == 2
    assert sleeps == [quizly.OPENTDB_MIN_INTERVAL_SECONDS]


@pytest.mark.asyncio
async def test_opentdb_fetch_waits_between_consecutive_calls(monkeypatch):
    sleeps = []
    clock = [100.0]

    async def fake_sleep(seconds):
        sleeps.append(round(seconds, 2))
        clock[0] += seconds

    class TimedQuizlyService(QuizlyService):
        def __init__(self):
            super().__init__(None, DummyDb())
            self.calls = 0

        async def _opentdb_fetch(self, url, params):
            self.calls += 1
            return {"response_code": 0, "results": [raw_question("easy", self.calls)]}

    monkeypatch.setattr(quizly.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(quizly.time, "monotonic", lambda: clock[0])
    service = TimedQuizlyService()

    await service._fetch_questions(1, "easy")
    await service._fetch_questions(1, "medium")

    assert service.calls == 2
    assert sleeps == [quizly.OPENTDB_MIN_INTERVAL_SECONDS]


def test_daily_query_matches_quizly_rules():
    assert quizly.daily_query("easy", "2026-06-26") == {
        "amount": 3,
        "difficulty": "easy",
    }
    assert quizly.daily_query("hard", "2026-06-26") == {
        "amount": 3,
        "difficulty": "hard",
    }


def test_puzzle_version_bump_ignores_old_cached_quizly_puzzles():
    assert quizly.PUZZLE_VERSION >= 4


def test_validate_translation_preserves_ids_and_correct_answer_shape():
    source = normalize_question(raw_question("easy", 1), random.Random(4), "q1")
    translated = validate_translation(
        [source],
        [
            {
                "id": "q1",
                "category": "Scienza e natura",
                "question": "Che cosa e Q1?",
                "answers": [
                    {"id": answer["id"], "text": f"IT {answer['text']}"}
                    for answer in source["answers"]
                ],
            }
        ],
    )

    assert translated[0]["id"] == source["id"]
    assert translated[0]["correctAnswerId"] == source["correctAnswerId"]
    assert translated[0]["question"] == "Che cosa e Q1?"
    assert [answer["id"] for answer in translated[0]["answers"]] == [
        answer["id"] for answer in source["answers"]
    ]
