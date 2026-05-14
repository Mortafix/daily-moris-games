from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

MAX_ATTEMPTS = 5
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
POOLS = {"best", "trending"}
LOCK_TTL_SECONDS = 60
TMDB_ITALIAN_LANGUAGE = "it-IT"
TMDB_ITALIAN_REGION = "IT"
BEST_TARGET_CANDIDATES = 400
BEST_MAX_PAGES = 40
TMDB_PAGE_BATCH_SIZE = 5
TRENDING_PAGE_COUNT = 3


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def today_key() -> str:
    return utc_now().date().isoformat()


def hash_string(value: str) -> int:
    hash_value = 2166136261
    for character in value:
        hash_value ^= ord(character)
        hash_value = (hash_value * 16777619) & 0xFFFFFFFF
    return hash_value


def normalize_pool(value: str | None) -> str:
    return value if value in POOLS else "best"


def normalize_language(value: str | None) -> str:
    return "it" if value == "it" else "en"


def tmdb_language(value: str | None) -> str:
    return "it-IT" if normalize_language(value) == "it" else "en-US"


def normalize_title(value: str | None) -> str:
    if not value:
        return ""
    decomposed = unicodedata.normalize("NFD", value)
    text = "".join(
        character for character in decomposed if unicodedata.category(character) != "Mn"
    )
    text = text.lower().replace("&", " and ")
    text = re.sub(r"['’`]", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return text.strip()


def get_year(release_date: str | None) -> int | None:
    try:
        year = int(str(release_date or "")[:4])
    except ValueError:
        return None
    return year if year > 0 else None


def poster_url(path: str | None, size: str = "w342") -> str:
    return f"{TMDB_IMAGE_BASE_URL}/{size}{path}" if path else ""


def public_movie(movie: dict[str, Any] | None, lang: str) -> dict[str, Any] | None:
    if not movie:
        return None
    language = normalize_language(lang)
    title = (
        (movie.get("titleIt") if language == "it" else movie.get("titleEn"))
        or movie.get("titleEn")
        or movie.get("titleIt")
        or movie.get("originalTitle")
        or ""
    )
    return {
        "id": movie.get("tmdbId") or movie.get("id"),
        "title": title,
        "originalTitle": movie.get("originalTitle") or "",
        "year": movie.get("year"),
        "posterPath": movie.get("posterPath") or "",
        "posterUrl": poster_url(movie.get("posterPath")),
    }


def public_puzzle(puzzle: dict[str, Any], lang: str) -> dict[str, Any]:
    return {
        "version": puzzle.get("version", 1),
        "date": puzzle.get("date"),
        "pool": puzzle.get("pool"),
        "levels": puzzle.get("levels", []),
    }


def is_emoji_only(value: str) -> bool:
    text = value.strip()
    if not text or re.search(r"[A-Za-z0-9]", text):
        return False
    for character in text:
        if character.isspace() or character in {"\ufe0f", "\u200d"}:
            continue
        if unicodedata.category(character) not in {"So", "Sk", "Sm"}:
            return False
    return True


def validate_emoji_levels(levels: Any) -> list[str] | None:
    if not isinstance(levels, list) or len(levels) != MAX_ATTEMPTS:
        return None

    previous_tokens: list[str] = []
    normalized: list[str] = []
    for level in levels:
        if not isinstance(level, str) or not is_emoji_only(level):
            return None
        tokens = [token for token in level.strip().split() if token]
        if len(tokens) < 2 or len(tokens) > 9:
            return None
        if tokens[: len(previous_tokens)] != previous_tokens:
            return None
        normalized.append(" ".join(tokens))
        previous_tokens = tokens
    return normalized


def get_collection_hint(
    answer_movie: dict[str, Any], guess_movie: dict[str, Any], lang: str
) -> dict[str, str]:
    if (
        answer_movie.get("collectionId")
        and guess_movie.get("collectionId")
        and answer_movie["collectionId"] == guess_movie["collectionId"]
    ):
        return {
            "type": "same_saga",
            "message": "Stessa saga, ma non e questo."
            if normalize_language(lang) == "it"
            else "Same saga, but not this one.",
        }
    return {"type": "", "message": ""}


def get_year_direction_hint(
    answer_movie: dict[str, Any],
    guess_movie: dict[str, Any],
    lang: str,
) -> dict[str, str]:
    answer_year = answer_movie.get("year")
    guess_year = guess_movie.get("year")
    if not isinstance(answer_year, int) or not isinstance(guess_year, int):
        return {"yearDirection": "", "message": ""}

    language = normalize_language(lang)
    if answer_year < guess_year:
        return {
            "yearDirection": "older",
            "message": "Il film corretto è più vecchio."
            if language == "it"
            else "The correct movie is older.",
        }
    if answer_year > guess_year:
        return {
            "yearDirection": "newer",
            "message": "Il film corretto è più recente."
            if language == "it"
            else "The correct movie is newer.",
        }
    return {
        "yearDirection": "same",
        "message": "Il film corretto è dello stesso anno."
        if language == "it"
        else "The correct movie is from the same year.",
    }


def get_guess_feedback(
    answer_movie: dict[str, Any],
    guess_movie: dict[str, Any],
    lang: str,
    attempt_number: int,
) -> dict[str, str]:
    same_saga = get_collection_hint(answer_movie, guess_movie, lang)
    year_hint = (
        get_year_direction_hint(answer_movie, guess_movie, lang)
        if attempt_number >= 3
        else {"yearDirection": "", "message": ""}
    )
    messages = [
        message
        for message in [same_saga.get("message"), year_hint.get("message")]
        if message
    ]
    if same_saga.get("type") and year_hint.get("yearDirection"):
        feedback_type = "combined"
    elif same_saga.get("type"):
        feedback_type = "same_saga"
    elif year_hint.get("yearDirection"):
        feedback_type = "year_direction"
    else:
        feedback_type = ""
    return {
        "type": feedback_type,
        "message": " ".join(messages),
        "yearDirection": year_hint.get("yearDirection", ""),
    }


class MovlyService:
    def __init__(self, settings: Any, db: Any):
        self.settings = settings
        self.db = db
        self.puzzles = db.movly_puzzles
        self.movie_cache = db.movly_movie_cache

    async def get_or_create_daily_puzzle(
        self, pool: str | None, lang: str | None
    ) -> dict[str, Any]:
        normalized_pool = normalize_pool(pool)
        normalized_lang = normalize_language(lang)
        date = today_key()
        ready = await self.puzzles.find_one(
            {
                "date": date,
                "pool": normalized_pool,
                "status": "ready",
            }
        )
        if ready:
            return {
                "status": "ready",
                "puzzle": public_puzzle(ready, normalized_lang),
            }

        acquired = await self._acquire_generation_lock(date, normalized_pool)
        if not acquired:
            refreshed = await self.puzzles.find_one(
                {"date": date, "pool": normalized_pool}
            )
            if refreshed and refreshed.get("status") == "ready":
                return {
                    "status": "ready",
                    "puzzle": public_puzzle(refreshed, normalized_lang),
                }
            return {
                "status": "generating",
                "date": date,
                "pool": normalized_pool,
            }

        try:
            puzzle = await self._generate_puzzle(normalized_pool, date)
            await self.puzzles.update_one(
                {"_id": self._puzzle_id(date, normalized_pool)},
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
                "puzzle": public_puzzle(puzzle, normalized_lang),
            }
        except Exception as error:
            await self.puzzles.update_one(
                {"_id": self._puzzle_id(date, normalized_pool)},
                {
                    "$set": {
                        "status": "failed",
                        "updatedAt": utc_now(),
                        "error": str(error),
                    },
                },
            )
            raise

    async def search_movies(
        self, query: str | None, lang: str | None, limit: int = 8
    ) -> list[dict[str, Any]]:
        clean_query = str(query or "").strip()[:80]
        if len(clean_query) < 2:
            return []
        payload = await self._tmdb_fetch(
            "/search/movie",
            {
                "query": clean_query,
                "include_adult": "false",
                "language": tmdb_language(lang),
                "page": "1",
            },
        )
        seen: set[int] = set()
        results: list[dict[str, Any]] = []
        for item in payload.get("results") or []:
            tmdb_id = int(item.get("id") or 0)
            if not tmdb_id or item.get("adult") or tmdb_id in seen:
                continue
            seen.add(tmdb_id)
            title = item.get("title") or item.get("original_title") or ""
            if not title:
                continue
            results.append(
                {
                    "id": tmdb_id,
                    "title": title,
                    "originalTitle": item.get("original_title") or "",
                    "year": get_year(item.get("release_date")),
                    "posterPath": item.get("poster_path") or "",
                    "posterUrl": poster_url(item.get("poster_path"), "w92"),
                }
            )
            if len(results) >= limit:
                break
        return results

    async def submit_guess(
        self,
        pool: str | None,
        lang: str | None,
        attempt_number: int,
        guess: dict[str, Any],
    ) -> tuple[int, dict[str, Any]]:
        normalized_pool = normalize_pool(pool)
        normalized_lang = normalize_language(lang)
        puzzle = await self.puzzles.find_one(
            {
                "date": today_key(),
                "pool": normalized_pool,
                "status": "ready",
            }
        )
        if not puzzle:
            return 409, {
                "error": "daily_not_ready",
                "message": "Daily puzzle is not ready yet.",
            }

        answer_movie = puzzle["movie"]
        safe_attempt_number = max(1, min(MAX_ATTEMPTS, int(attempt_number or 1)))
        final_attempt = safe_attempt_number >= MAX_ATTEMPTS
        if guess.get("skip"):
            return 200, {
                "valid": True,
                "correct": False,
                "finalAttempt": final_attempt,
                "skipped": True,
                "feedback": {"type": "", "message": "", "yearDirection": ""},
                "guess": {"skip": True},
                "answer": public_movie(answer_movie, normalized_lang)
                if final_attempt
                else None,
            }

        guess_movie = await self.resolve_guess(guess, normalized_lang)
        if not guess_movie:
            return 200, {
                "valid": False,
                "correct": False,
                "message": "Film non trovato."
                if normalized_lang == "it"
                else "Movie not found.",
            }

        correct = guess_movie["tmdbId"] == answer_movie["tmdbId"]
        feedback = (
            {"type": "", "message": "", "yearDirection": ""}
            if correct
            else get_guess_feedback(
                answer_movie,
                guess_movie,
                normalized_lang,
                safe_attempt_number,
            )
        )

        return 200, {
            "valid": True,
            "correct": correct,
            "finalAttempt": final_attempt,
            "feedback": feedback,
            "guess": public_movie(guess_movie, normalized_lang),
            "answer": public_movie(answer_movie, normalized_lang)
            if correct or final_attempt
            else None,
        }

    async def resolve_guess(
        self, guess: dict[str, Any], lang: str | None
    ) -> dict[str, Any] | None:
        tmdb_id = int(guess.get("tmdbId") or guess.get("id") or 0)
        if tmdb_id > 0:
            return await self.get_movie_details(tmdb_id)

        title = str(guess.get("title") or guess.get("query") or "").strip()
        results = await self.search_movies(title, lang)
        match = self._find_best_search_match(results, title)
        return await self.get_movie_details(match["id"]) if match else None

    async def get_movie_details(self, tmdb_id: int) -> dict[str, Any]:
        cached = await self.movie_cache.find_one({"tmdbId": tmdb_id})
        if cached:
            cached.pop("_id", None)
            return cached

        details_en, details_it = await self._fetch_movie_detail_pair(tmdb_id)
        collection_en = details_en.get("belongs_to_collection") or {}
        collection_it = details_it.get("belongs_to_collection") or {}
        movie = {
            "tmdbId": int(details_en["id"]),
            "titleEn": details_en.get("title")
            or details_en.get("original_title")
            or "",
            "titleIt": details_it.get("title")
            or details_en.get("title")
            or details_en.get("original_title")
            or "",
            "originalTitle": details_en.get("original_title") or "",
            "overview": details_en.get("overview") or details_it.get("overview") or "",
            "releaseDate": details_en.get("release_date")
            or details_it.get("release_date")
            or "",
            "year": get_year(
                details_en.get("release_date") or details_it.get("release_date")
            ),
            "posterPath": details_en.get("poster_path")
            or details_it.get("poster_path")
            or "",
            "backdropPath": details_en.get("backdrop_path")
            or details_it.get("backdrop_path")
            or "",
            "collectionId": collection_en.get("id") or collection_it.get("id"),
            "collectionNameEn": collection_en.get("name") or "",
            "collectionNameIt": collection_it.get("name")
            or collection_en.get("name")
            or "",
            "aliases": self._collect_aliases(details_en, details_it),
            "cachedAt": utc_now(),
        }
        await self.movie_cache.replace_one(
            {"tmdbId": movie["tmdbId"]}, movie, upsert=True
        )
        return movie

    async def _acquire_generation_lock(self, date: str, pool: str) -> bool:
        puzzle_id = self._puzzle_id(date, pool)
        now = utc_now()
        try:
            await self.puzzles.insert_one(
                {
                    "_id": puzzle_id,
                    "date": date,
                    "pool": pool,
                    "status": "generating",
                    "version": 1,
                    "levels": [],
                    "movie": None,
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

    async def _generate_puzzle(self, pool: str, date: str) -> dict[str, Any]:
        movie = await self._select_daily_movie(pool, date)
        levels = await self._generate_emoji_levels(movie)
        return {
            "version": 1,
            "date": date,
            "pool": pool,
            "source": pool,
            "movie": movie,
            "levels": levels,
            "createdAt": utc_now(),
        }

    async def _select_daily_movie(self, pool: str, date: str) -> dict[str, Any]:
        candidates = await self._fetch_pool_candidates(pool)
        other_pool = "trending" if pool == "best" else "best"
        other_puzzle = await self.puzzles.find_one(
            {
                "date": date,
                "pool": other_pool,
                "status": "ready",
            }
        )
        other_movie_id = (other_puzzle or {}).get("movie", {}).get("tmdbId")
        excluded_ids = {int(other_movie_id)} if other_movie_id else set()

        filtered_candidates = [
            candidate
            for candidate in candidates
            if int(candidate["id"]) not in excluded_ids
        ]
        selected = self._choose_candidate(
            filtered_candidates or candidates,
            f"movly-daily:v1:{date}:{pool}:movie",
        )
        return await self.get_movie_details(int(selected["id"]))

    async def _fetch_pool_candidates(self, pool: str) -> list[dict[str, Any]]:
        if pool == "best":
            return await self._fetch_best_pool_candidates()

        payloads = await self._gather_tmdb_pages(
            "/trending/movie/week",
            TRENDING_PAGE_COUNT,
            {"language": TMDB_ITALIAN_LANGUAGE},
        )
        candidates = self._collect_playable_candidates(payloads, pool)
        if not candidates:
            raise RuntimeError("No playable TMDB movie candidates")
        return candidates

    async def _fetch_best_pool_candidates(self) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []
        seen: set[int] = set()
        page = 1
        total_pages = BEST_MAX_PAGES
        async with httpx.AsyncClient(timeout=20) as client:
            while (
                page <= min(total_pages, BEST_MAX_PAGES)
                and len(candidates) < BEST_TARGET_CANDIDATES
            ):
                end_page = min(
                    page + TMDB_PAGE_BATCH_SIZE - 1,
                    total_pages,
                    BEST_MAX_PAGES,
                )
                tasks = [
                    self._tmdb_fetch_with_client(
                        client,
                        "/movie/top_rated",
                        {
                            "language": TMDB_ITALIAN_LANGUAGE,
                            "region": TMDB_ITALIAN_REGION,
                            "page": str(current_page),
                        },
                    )
                    for current_page in range(page, end_page + 1)
                ]
                payloads = await _safe_gather(tasks)
                for payload in payloads:
                    total_pages = min(
                        BEST_MAX_PAGES,
                        int(payload.get("total_pages") or total_pages),
                    )
                    for item in payload.get("results") or []:
                        tmdb_id = int(item.get("id") or 0)
                        if (
                            not tmdb_id
                            or tmdb_id in seen
                            or not self._is_playable_candidate(item, "best")
                        ):
                            continue
                        seen.add(tmdb_id)
                        candidates.append(item)
                page = end_page + 1

        if not candidates:
            raise RuntimeError("No playable TMDB movie candidates")
        return candidates

    def _collect_playable_candidates(
        self,
        payloads: list[dict[str, Any]],
        pool: str,
    ) -> list[dict[str, Any]]:
        seen: set[int] = set()
        candidates: list[dict[str, Any]] = []
        for payload in payloads:
            for item in payload.get("results") or []:
                tmdb_id = int(item.get("id") or 0)
                if (
                    not tmdb_id
                    or tmdb_id in seen
                    or not self._is_playable_candidate(item, pool)
                ):
                    continue
                seen.add(tmdb_id)
                candidates.append(item)
        return candidates

    async def _gather_tmdb_pages(
        self,
        path: str,
        page_count: int,
        params: dict[str, str],
    ) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20) as client:
            tasks = [
                self._tmdb_fetch_with_client(
                    client,
                    path,
                    {**params, "page": str(page)},
                )
                for page in range(1, page_count + 1)
            ]
            return [payload for payload in await _safe_gather(tasks) if payload]

    def _choose_candidate(
        self, candidates: list[dict[str, Any]], seed: str
    ) -> dict[str, Any]:
        if not candidates:
            raise RuntimeError("No playable TMDB movie candidates")
        return candidates[hash_string(seed) % len(candidates)]

    def _is_playable_candidate(self, item: dict[str, Any], pool: str) -> bool:
        if (
            item.get("adult")
            or not item.get("id")
            or not item.get("title")
            or not item.get("release_date")
        ):
            return False
        if not item.get("poster_path") or not item.get("overview"):
            return False
        vote_count = int(item.get("vote_count") or 0)
        return vote_count >= 1000 if pool == "best" else vote_count >= 20

    async def _fetch_movie_detail_pair(
        self, tmdb_id: int
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        details_en, details_it = await _safe_gather(
            [
                self._tmdb_fetch(
                    f"/movie/{tmdb_id}",
                    {"language": "en-US", "append_to_response": "alternative_titles"},
                ),
                self._tmdb_fetch(f"/movie/{tmdb_id}", {"language": "it-IT"}),
            ],
            raise_errors=True,
        )
        return details_en, details_it

    def _collect_aliases(
        self, details_en: dict[str, Any], details_it: dict[str, Any]
    ) -> list[str]:
        aliases = {
            normalize_title(details_en.get("title")),
            normalize_title(details_it.get("title")),
            normalize_title(details_en.get("original_title")),
            normalize_title(details_it.get("original_title")),
        }
        for entry in (details_en.get("alternative_titles") or {}).get("titles") or []:
            aliases.add(normalize_title(entry.get("title")))
        return sorted(alias for alias in aliases if alias)

    async def _generate_emoji_levels(self, movie: dict[str, Any]) -> list[str]:
        if not self.settings.openai_api_key:
            raise RuntimeError("Missing OPENAI_API_KEY")

        schema = {
            "type": "object",
            "additionalProperties": False,
            "required": ["levels"],
            "properties": {
                "levels": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
        }
        prompt = "\n".join(
            part
            for part in [
                f"Movie: {movie['titleEn']}",
                f"Original title: {movie['originalTitle']}"
                if movie.get("originalTitle") != movie.get("titleEn")
                else "",
                f"Year: {movie['year']}" if movie.get("year") else "",
                f"Plot: {movie['overview']}" if movie.get("overview") else "",
            ]
            if part
        )

        for _ in range(2):
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
                                    "Generate Movly emoji hints for a daily movie guessing game. "
                                    "Return JSON only through the provided schema. "
                                    "Create exactly five cumulative levels. "
                                    "Each level must contain only emoji separated by single spaces. "
                                    "No words, no letters, no numbers, no punctuation, no keycaps. "
                                    "Level 1 should be hard but fair. Level 5 should make the movie recognizable. "
                                    "Every next level must keep all previous emoji in the same order and add one or two useful emoji."
                                ),
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "text": {
                            "format": {
                                "type": "json_schema",
                                "name": "movly_emoji_levels",
                                "strict": True,
                                "schema": schema,
                            },
                        },
                        "max_output_tokens": 600,
                    },
                )
            payload = response.json()
            if response.status_code >= 400:
                message = (payload.get("error") or {}).get(
                    "message"
                ) or f"OpenAI request failed: {response.status_code}"
                raise RuntimeError(message)

            try:
                parsed = json.loads(_extract_openai_text(payload))
            except json.JSONDecodeError:
                parsed = {}
            levels = validate_emoji_levels(parsed.get("levels"))
            if levels:
                return levels

        raise RuntimeError("OpenAI returned invalid emoji levels")

    async def _tmdb_fetch(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20) as client:
            return await self._tmdb_fetch_with_client(client, path, params)

    async def _tmdb_fetch_with_client(
        self,
        client: httpx.AsyncClient,
        path: str,
        params: dict[str, str],
    ) -> dict[str, Any]:
        if not self.settings.tmdb_bearer_token:
            raise RuntimeError("Missing TMDB_BEARER_TOKEN")
        response = await client.get(
            f"{TMDB_BASE_URL}{path}",
            params=params,
            headers={
                "Authorization": f"Bearer {self.settings.tmdb_bearer_token}",
                "Accept": "application/json",
            },
        )
        payload = response.json()
        if response.status_code >= 400:
            raise RuntimeError(
                payload.get("status_message")
                or f"TMDB request failed: {response.status_code}"
            )
        return payload

    def _find_best_search_match(
        self, results: list[dict[str, Any]], query: str
    ) -> dict[str, Any] | None:
        normalized_query = normalize_title(query)
        if not normalized_query:
            return None
        for movie in results:
            if (
                normalize_title(movie.get("title")) == normalized_query
                or normalize_title(movie.get("originalTitle")) == normalized_query
                or f"{normalize_title(movie.get('title'))} {movie.get('year') or ''}".strip()
                == normalized_query
            ):
                return movie
        return results[0] if results else None

    def _puzzle_id(self, date: str, pool: str) -> str:
        return f"movly-daily:v1:{date}:{pool}"


async def _safe_gather(tasks, raise_errors: bool = False):
    import asyncio

    results = await asyncio.gather(*tasks, return_exceptions=not raise_errors)
    if raise_errors:
        return results
    return [result for result in results if not isinstance(result, Exception)]


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
