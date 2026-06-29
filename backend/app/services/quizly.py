from __future__ import annotations

import asyncio
import html
import json
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError


MAX_QUESTIONS = 3
PUZZLE_VERSION = 4
MODES = {"easy", "hard"}
LOCK_TTL_SECONDS = 60
OPENTDB_API_URL = "https://opentdb.com/api.php"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
QUESTION_COUNT = 3
OPENTDB_RATE_LIMIT_CODE = 5
OPENTDB_MIN_INTERVAL_SECONDS = 5.2
OPENTDB_RESPONSE_MESSAGES = {
    1: "No results: OpenTDB does not have enough questions for this query.",
    2: "Invalid parameter: OpenTDB rejected the query parameters.",
    3: "Token not found: OpenTDB session token does not exist.",
    4: "Token empty: OpenTDB session token has returned all possible questions.",
    5: "Rate limit: OpenTDB allows one request per IP every five seconds.",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def today_key() -> str:
    return utc_now().date().isoformat()


def normalize_mode(value: str | None) -> str:
    return value if value in MODES else "easy"


def normalize_language(value: str | None) -> str:
    return "it" if value == "it" else "en"


def daily_query(mode: str, date: str) -> dict[str, Any]:
    if mode == "hard":
        return {"amount": QUESTION_COUNT, "difficulty": "hard"}

    return {"amount": QUESTION_COUNT, "difficulty": "easy"}


def public_puzzle(
    puzzle: dict[str, Any],
    lang: str,
    questions: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "version": puzzle.get("version", 1),
        "date": puzzle.get("date"),
        "mode": puzzle.get("mode"),
        "lang": normalize_language(lang),
        "questions": questions,
    }


def normalize_question(raw: dict[str, Any], rng: random.Random, question_id: str) -> dict[str, Any]:
    correct_answer = html.unescape(str(raw.get("correct_answer") or "")).strip()
    incorrect_answers = [
        html.unescape(str(answer or "")).strip()
        for answer in raw.get("incorrect_answers") or []
    ]
    answers = [
        {"id": f"{question_id}:correct", "text": correct_answer, "correct": True},
        *[
            {"id": f"{question_id}:wrong-{index}", "text": answer, "correct": False}
            for index, answer in enumerate(incorrect_answers)
        ],
    ]
    rng.shuffle(answers)
    correct_answer_id = next(answer["id"] for answer in answers if answer["correct"])
    return {
        "id": question_id,
        "category": html.unescape(str(raw.get("category") or "")).strip(),
        "difficulty": html.unescape(str(raw.get("difficulty") or "")).strip(),
        "question": html.unescape(str(raw.get("question") or "")).strip(),
        "answers": [
            {"id": answer["id"], "text": answer["text"]}
            for answer in answers
        ],
        "correctAnswerId": correct_answer_id,
    }


class QuizlyService:
    def __init__(self, settings: Any, db: Any):
        self.settings = settings
        self.db = db
        self.puzzles = db.quizly_puzzles
        self._opentdb_lock = asyncio.Lock()
        self._last_opentdb_request_at = 0.0

    async def get_or_create_daily_puzzle(
        self, mode: str | None, lang: str | None
    ) -> dict[str, Any]:
        normalized_mode = normalize_mode(mode)
        normalized_lang = normalize_language(lang)
        date = today_key()
        ready = await self.puzzles.find_one(
            {
                "date": date,
                "mode": normalized_mode,
                "status": "ready",
                "version": PUZZLE_VERSION,
            }
        )
        if ready:
            return {
                "status": "ready",
                "puzzle": await self._public_puzzle(ready, normalized_lang),
            }

        acquired = await self._acquire_generation_lock(date, normalized_mode)
        if not acquired:
            refreshed = await self.puzzles.find_one(
                {"date": date, "mode": normalized_mode}
            )
            if refreshed and refreshed.get("status") == "ready":
                return {
                    "status": "ready",
                    "puzzle": await self._public_puzzle(refreshed, normalized_lang),
                }
            return {
                "status": "generating",
                "date": date,
                "mode": normalized_mode,
            }

        try:
            puzzle = await self._generate_puzzle(normalized_mode, date)
            await self.puzzles.update_one(
                {"_id": self._puzzle_id(date, normalized_mode)},
                {
                    "$set": {
                        **puzzle,
                        "status": "ready",
                        "updatedAt": utc_now(),
                        "error": "",
                    },
                },
            )
            return {
                "status": "ready",
                "puzzle": await self._public_puzzle(puzzle, normalized_lang),
            }
        except Exception as error:
            await self.puzzles.update_one(
                {"_id": self._puzzle_id(date, normalized_mode)},
                {
                    "$set": {
                        "status": "failed",
                        "updatedAt": utc_now(),
                        "error": str(error),
                    },
                },
            )
            raise

    async def _acquire_generation_lock(self, date: str, mode: str) -> bool:
        puzzle_id = self._puzzle_id(date, mode)
        now = utc_now()
        try:
            await self.puzzles.insert_one(
                {
                    "_id": puzzle_id,
                    "date": date,
                    "mode": mode,
                    "status": "generating",
                    "version": PUZZLE_VERSION,
                    "questions": [],
                    "createdAt": now,
                    "updatedAt": now,
                    "error": "",
                }
            )
            return True
        except DuplicateKeyError:
            pass

        stale_before = now - timedelta(seconds=LOCK_TTL_SECONDS)
        acquired = await self.puzzles.find_one_and_update(
            {
                "_id": puzzle_id,
                "$or": [
                    {"status": "failed"},
                    {"version": {"$ne": PUZZLE_VERSION}},
                    {"status": "generating", "updatedAt": {"$lt": stale_before}},
                ],
            },
            {
                "$set": {
                    "status": "generating",
                    "updatedAt": now,
                    "error": "",
                },
            },
            return_document=ReturnDocument.AFTER,
        )
        return acquired is not None

    async def _generate_puzzle(self, mode: str, date: str) -> dict[str, Any]:
        rng = random.Random(f"quizly:{date}:{mode}")
        query = daily_query(mode, date)
        difficulty = query["difficulty"]
        raw_questions = await self._fetch_questions(query["amount"], difficulty)
        questions = [
            normalize_question(raw_question, rng, f"{difficulty}-{index}")
            for index, raw_question in enumerate(raw_questions)
        ]

        return {
            "version": PUZZLE_VERSION,
            "date": date,
            "mode": mode,
            "source": "opentdb",
            "sourceDifficulty": difficulty,
            "questions": questions,
            "translations": {},
            "createdAt": utc_now(),
        }

    async def _public_puzzle(self, puzzle: dict[str, Any], lang: str) -> dict[str, Any]:
        normalized_lang = normalize_language(lang)
        if normalized_lang != "it":
            return public_puzzle(puzzle, normalized_lang, puzzle.get("questions", []))

        translated = (
            (puzzle.get("translations") or {})
            .get("it", {})
            .get("questions")
        )
        if not translated:
            translated = await self._translate_questions_it(puzzle.get("questions", []))
            if translated:
                await self.puzzles.update_one(
                    {"_id": puzzle.get("_id") or self._puzzle_id(puzzle["date"], puzzle["mode"])},
                    {
                        "$set": {
                            "translations.it.questions": translated,
                            "translations.it.updatedAt": utc_now(),
                        },
                    },
                )

        return public_puzzle(
            puzzle,
            normalized_lang,
            translated or puzzle.get("questions", []),
        )

    async def _translate_questions_it(
        self, questions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        if not questions or not self.settings.openai_api_key:
            return []

        schema = {
            "type": "object",
            "additionalProperties": False,
            "required": ["questions"],
            "properties": {
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["id", "category", "question", "answers"],
                        "properties": {
                            "id": {"type": "string"},
                            "category": {"type": "string"},
                            "question": {"type": "string"},
                            "answers": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["id", "text"],
                                    "properties": {
                                        "id": {"type": "string"},
                                        "text": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
        source_questions = [
            {
                "id": question["id"],
                "category": question.get("category", ""),
                "question": question.get("question", ""),
                "answers": [
                    {"id": answer["id"], "text": answer.get("text", "")}
                    for answer in question.get("answers", [])
                ],
            }
            for question in questions
        ]

        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                OPENAI_RESPONSES_URL,
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.openai_emoji_model,
                    "input": [
                        {
                            "role": "system",
                            "content": (
                                "Translate trivia questions from English to Italian. "
                                "Return JSON only through the provided schema. "
                                "Keep every id unchanged. Preserve the exact number and order "
                                "of questions and answers. Translate category, question, and answer text. "
                                "Do not reveal which answer is correct."
                            ),
                        },
                        {
                            "role": "user",
                            "content": json.dumps(
                                {"questions": source_questions},
                                ensure_ascii=False,
                            ),
                        },
                    ],
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": "quizly_italian_translation",
                            "strict": True,
                            "schema": schema,
                        },
                    },
                    "max_output_tokens": 1800,
                },
            )
        payload = response.json()
        if response.status_code >= 400:
            return []

        try:
            parsed = json.loads(_extract_openai_text(payload))
        except json.JSONDecodeError:
            return []
        return validate_translation(questions, parsed.get("questions"))

    async def _fetch_questions(
        self, amount: int, difficulty: str
    ) -> list[dict[str, Any]]:
        params = {
            "amount": str(amount),
            "difficulty": difficulty,
            "type": "multiple",
        }
        payload = await self._rate_limited_opentdb_fetch(OPENTDB_API_URL, params)
        if payload.get("response_code") == OPENTDB_RATE_LIMIT_CODE:
            await asyncio.sleep(OPENTDB_MIN_INTERVAL_SECONDS)
            payload = await self._rate_limited_opentdb_fetch(OPENTDB_API_URL, params)
        if payload.get("response_code") != 0:
            raise RuntimeError(opentdb_error_message(payload.get("response_code")))

        results = payload.get("results") or []
        if len(results) != amount:
            raise RuntimeError("OpenTDB returned an unexpected number of questions.")
        return results

    async def _rate_limited_opentdb_fetch(
        self, url: str, params: dict[str, str]
    ) -> dict[str, Any]:
        async with self._opentdb_lock:
            elapsed = time.monotonic() - self._last_opentdb_request_at
            wait_seconds = OPENTDB_MIN_INTERVAL_SECONDS - elapsed
            if wait_seconds > 0:
                await asyncio.sleep(wait_seconds)
            payload = await self._opentdb_fetch(url, params)
            self._last_opentdb_request_at = time.monotonic()
            return payload

    async def _opentdb_fetch(self, url: str, params: dict[str, str]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    def _puzzle_id(self, date: str, mode: str) -> str:
        return f"{date}:{mode}"


def validate_translation(
    source_questions: list[dict[str, Any]],
    translated_questions: Any,
) -> list[dict[str, Any]]:
    if not isinstance(translated_questions, list) or len(translated_questions) != len(source_questions):
        return []

    translated_by_id = {
        question.get("id"): question
        for question in translated_questions
        if isinstance(question, dict)
    }
    normalized: list[dict[str, Any]] = []
    for source in source_questions:
        translated = translated_by_id.get(source.get("id"))
        if not translated:
            return []
        translated_answers = translated.get("answers")
        if not isinstance(translated_answers, list):
            return []
        answers_by_id = {
            answer.get("id"): answer
            for answer in translated_answers
            if isinstance(answer, dict)
        }
        answers: list[dict[str, str]] = []
        for source_answer in source.get("answers", []):
            translated_answer = answers_by_id.get(source_answer.get("id"))
            if not translated_answer or not isinstance(translated_answer.get("text"), str):
                return []
            answers.append(
                {
                    "id": source_answer["id"],
                    "text": translated_answer["text"].strip() or source_answer.get("text", ""),
                }
            )

        normalized.append(
            {
                **source,
                "category": str(translated.get("category") or source.get("category", "")).strip(),
                "question": str(translated.get("question") or source.get("question", "")).strip(),
                "answers": answers,
            }
        )
    return normalized


def opentdb_error_message(response_code: Any) -> str:
    try:
        code = int(response_code)
    except (TypeError, ValueError):
        return f"OpenTDB returned unknown response_code {response_code}."
    message = OPENTDB_RESPONSE_MESSAGES.get(code, "Unknown OpenTDB response code.")
    return f"OpenTDB returned response_code {code}: {message}"


def _extract_openai_text(payload: dict[str, Any]) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]
    chunks: list[str] = []
    for item in payload.get("output") or []:
        for content in item.get("content") or []:
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "".join(chunks)
