import pytest

from backend.app.services.movly import (
    MovlyService,
    get_collection_hint,
    get_guess_feedback,
    normalize_title,
    validate_emoji_levels,
)


class DummySettings:
    tmdb_bearer_token = "token"
    openai_api_key = "key"
    openai_emoji_model = "gpt-4.1-mini"


class DummyDb:
    movly_puzzles = None
    movly_movie_cache = None


class FakePuzzleCollection:
    async def find_one(self, _query):
        return {
            "movie": {
                "tmdbId": 597,
                "titleEn": "Titanic",
                "titleIt": "Titanic",
                "originalTitle": "Titanic",
                "year": 1997,
                "posterPath": "",
            }
        }


class SkipDb:
    movly_puzzles = FakePuzzleCollection()
    movly_movie_cache = None


def test_normalize_title_strips_accents_and_punctuation():
    assert normalize_title("Léon: The Professional") == "leon the professional"
    assert normalize_title("Wall-E") == "wall e"


def test_validate_emoji_levels_requires_cumulative_five_levels():
    levels = [
        "🚢 ❤️",
        "🚢 ❤️ 🌊",
        "🚢 ❤️ 🌊 🧊",
        "🚢 ❤️ 🌊 🧊 🎻",
        "🚢 ❤️ 🌊 🧊 🎻 💎",
    ]
    assert validate_emoji_levels(levels) == levels


def test_validate_emoji_levels_rejects_text():
    levels = [
        "🚢 ❤️",
        "🚢 ❤️ movie",
        "🚢 ❤️ 🌊 🧊",
        "🚢 ❤️ 🌊 🧊 🎻",
        "🚢 ❤️ 🌊 🧊 🎻 💎",
    ]
    assert validate_emoji_levels(levels) is None


def test_validate_emoji_levels_accepts_regional_indicators():
    levels = [
        "🇮🇹 🎬",
        "🇮🇹 🎬 ❤️",
        "🇮🇹 🎬 ❤️ 🍝",
        "🇮🇹 🎬 ❤️ 🍝 🚗",
        "🇮🇹 🎬 ❤️ 🍝 🚗 🌊",
    ]
    assert validate_emoji_levels(levels) == levels


def test_same_saga_hint_only_for_matching_collection():
    answer = {"collectionId": 10}
    guess = {"collectionId": 10}
    other = {"collectionId": 11}

    assert get_collection_hint(answer, guess, "it")["type"] == "same_saga"
    assert get_collection_hint(answer, other, "it")["type"] == ""


def test_year_hint_starts_on_third_wrong_guess():
    answer = {"year": 1997, "collectionId": None}
    guess = {"year": 2010, "collectionId": None}

    assert get_guess_feedback(answer, guess, "it", 2)["type"] == ""
    feedback = get_guess_feedback(answer, guess, "it", 3)
    assert feedback["type"] == "year_direction"
    assert feedback["yearDirection"] == "older"


def test_combines_same_saga_and_year_hint():
    answer = {"year": 1980, "collectionId": 10}
    guess = {"year": 1977, "collectionId": 10}

    feedback = get_guess_feedback(answer, guess, "en", 3)
    assert feedback["type"] == "combined"
    assert feedback["yearDirection"] == "newer"
    assert "Same saga" in feedback["message"]


@pytest.mark.asyncio
async def test_final_skip_reveals_answer_without_resolving_movie(monkeypatch):
    service = MovlyService(DummySettings(), SkipDb())

    async def fail_resolve(_guess, _lang):
        raise AssertionError("Skip should not resolve a movie")

    monkeypatch.setattr(service, "resolve_guess", fail_resolve)
    status_code, payload = await service.submit_guess(
        "best",
        "it",
        5,
        {"skip": True},
    )

    assert status_code == 200
    assert payload["valid"] is True
    assert payload["skipped"] is True
    assert payload["finalAttempt"] is True
    assert payload["answer"]["title"] == "Titanic"


def make_movie(movie_id):
    return {
        "id": movie_id,
        "title": f"Movie {movie_id}",
        "release_date": "2000-01-01",
        "poster_path": f"/{movie_id}.jpg",
        "overview": "Overview",
        "vote_count": 1500,
        "adult": False,
    }


async def fake_tmdb_page(_client, _path, params):
    page = int(params["page"])
    start = (page - 1) * 20
    return {
        "total_pages": 50,
        "results": [make_movie(start + offset + 1) for offset in range(20)],
    }


@pytest.mark.asyncio
async def test_best_pool_uses_italian_market_and_collects_400(monkeypatch):
    calls = []
    service = MovlyService(DummySettings(), DummyDb())

    async def fake_fetch(client, path, params):
        calls.append((path, params))
        return await fake_tmdb_page(client, path, params)

    monkeypatch.setattr(service, "_tmdb_fetch_with_client", fake_fetch)

    candidates = await service._fetch_pool_candidates("best")

    assert len(candidates) >= 400
    assert all(path == "/movie/top_rated" for path, _params in calls)
    assert all(params["language"] == "it-IT" for _path, params in calls)
    assert all(params["region"] == "IT" for _path, params in calls)


@pytest.mark.asyncio
async def test_trending_pool_uses_three_italian_language_pages(monkeypatch):
    calls = []
    service = MovlyService(DummySettings(), DummyDb())

    async def fake_fetch(client, path, params):
        calls.append((path, params))
        return await fake_tmdb_page(client, path, params)

    monkeypatch.setattr(service, "_tmdb_fetch_with_client", fake_fetch)

    candidates = await service._fetch_pool_candidates("trending")

    assert len(candidates) == 60
    assert len(calls) == 3
    assert all(path == "/trending/movie/week" for path, _params in calls)
    assert all(params["language"] == "it-IT" for _path, params in calls)
    assert all("region" not in params for _path, params in calls)
