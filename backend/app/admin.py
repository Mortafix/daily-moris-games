from __future__ import annotations

import argparse
import asyncio
import inspect
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

MOVLY_POOLS = ("best", "trending")
QUIZLY_MODES = ("easy", "hard")


@dataclass(frozen=True)
class ResetOperation:
    collection: str
    filter: dict[str, str]


def today_key() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def valid_date(value: str) -> str:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as error:
        raise argparse.ArgumentTypeError("Use date format YYYY-MM-DD.") from error
    return value


def expand_selection(value: str, allowed: tuple[str, ...]) -> tuple[str, ...]:
    return allowed if value == "all" else (value,)


def build_reset_operations(
    *,
    date: str,
    game: str,
    pool: str,
    mode: str,
) -> list[ResetOperation]:
    operations: list[ResetOperation] = []

    if game in {"all", "movly"}:
        operations.extend(
            ResetOperation(
                collection="movly_puzzles",
                filter={"date": date, "pool": selected_pool},
            )
            for selected_pool in expand_selection(pool, MOVLY_POOLS)
        )

    if game in {"all", "quizly"}:
        operations.extend(
            ResetOperation(
                collection="quizly_puzzles",
                filter={"date": date, "mode": selected_mode},
            )
            for selected_mode in expand_selection(mode, QUIZLY_MODES)
        )

    return operations


def get_async_mongo_client():
    try:
        from pymongo import AsyncMongoClient
    except ImportError:  # pragma: no cover - older PyMongo async import path.
        from pymongo.asynchronous import AsyncMongoClient

    return AsyncMongoClient


async def reset_daily(args: argparse.Namespace) -> int:
    operations = build_reset_operations(
        date=args.date,
        game=args.game,
        pool=args.pool,
        mode=args.mode,
    )

    if args.dry_run:
        for operation in operations:
            print(f"Would delete from {operation.collection}: {operation.filter}")
        return 0

    from .config import get_settings

    settings = get_settings()
    AsyncMongoClient = get_async_mongo_client()
    client = AsyncMongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db]
        total_deleted = 0
        for operation in operations:
            result: Any = await db[operation.collection].delete_many(operation.filter)
            total_deleted += int(result.deleted_count)
            print(
                f"Deleted {result.deleted_count} from "
                f"{operation.collection}: {operation.filter}"
            )
        print(f"Reset complete for {args.date}. Deleted {total_deleted} document(s).")
        return 0
    finally:
        close_result = client.close()
        if inspect.isawaitable(close_result):
            await close_result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Admin utilities for Daily Moris Games.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    reset_parser = subparsers.add_parser(
        "reset-daily",
        help="Delete generated backend daily puzzles so they can be regenerated.",
    )
    reset_parser.add_argument(
        "--date",
        type=valid_date,
        default=today_key(),
        help="Daily date to reset in YYYY-MM-DD format. Defaults to today in UTC.",
    )
    reset_parser.add_argument(
        "--game",
        choices=("all", "movly", "quizly"),
        default="all",
        help="Backend daily game to reset.",
    )
    reset_parser.add_argument(
        "--pool",
        choices=("all", *MOVLY_POOLS),
        default="all",
        help="Movly pool to reset when --game is all or movly.",
    )
    reset_parser.add_argument(
        "--mode",
        choices=("all", *QUIZLY_MODES),
        default="all",
        help="Quizly mode to reset when --game is all or quizly.",
    )
    reset_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the MongoDB deletes without running them.",
    )
    reset_parser.set_defaults(handler=reset_daily)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return asyncio.run(args.handler(args))


if __name__ == "__main__":
    raise SystemExit(main())
