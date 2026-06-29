from backend.app.admin import build_reset_operations


def operation_pairs(operations):
    return [(operation.collection, operation.filter) for operation in operations]


def test_build_reset_operations_defaults_to_all_backend_dailies():
    operations = build_reset_operations(
        date="2026-06-26",
        game="all",
        pool="all",
        mode="all",
    )

    assert operation_pairs(operations) == [
        ("movly_puzzles", {"date": "2026-06-26", "pool": "best"}),
        ("movly_puzzles", {"date": "2026-06-26", "pool": "trending"}),
        ("quizly_puzzles", {"date": "2026-06-26", "mode": "easy"}),
        ("quizly_puzzles", {"date": "2026-06-26", "mode": "hard"}),
    ]


def test_build_reset_operations_can_target_movly_pool():
    operations = build_reset_operations(
        date="2026-06-26",
        game="movly",
        pool="best",
        mode="all",
    )

    assert operation_pairs(operations) == [
        ("movly_puzzles", {"date": "2026-06-26", "pool": "best"}),
    ]


def test_build_reset_operations_can_target_quizly_mode():
    operations = build_reset_operations(
        date="2026-06-26",
        game="quizly",
        pool="all",
        mode="hard",
    )

    assert operation_pairs(operations) == [
        ("quizly_puzzles", {"date": "2026-06-26", "mode": "hard"}),
    ]
