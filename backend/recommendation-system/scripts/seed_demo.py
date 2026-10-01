"""Generate synthetic users + interactions for local development.

Usage:
    python scripts/seed_demo.py [--users 30] [--reset]

Writes events to DATA_DIR/events.jsonl and trains artifacts.
"""

from __future__ import annotations

import argparse
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import SETTINGS  # noqa: E402
from app.data.demo_catalog import load_catalog  # noqa: E402
from app.data.store import EventStore  # noqa: E402
from app.services.trainer import run_training  # noqa: E402

TASTES = [
    ("Development", "intermediate"),
    ("Development", "beginner"),
    ("Data Science", "intermediate"),
    ("Data Science", "beginner"),
    ("Design", "beginner"),
    ("Design", "advanced"),
    ("Business", "beginner"),
    ("Marketing", "beginner"),
]

KINDS = ["view"] * 55 + ["like"] * 20 + ["complete"] * 10 + ["enroll"] * 6 + ["share"] * 4 + ["rate"] * 5


def seed(users: int, seed: int = 7) -> int:
    rng = random.Random(seed)
    catalog = load_catalog()
    by_category: dict[str, list[dict]] = {}
    for item in catalog:
        by_category.setdefault(item["category"], []).append(item)

    store = EventStore(SETTINGS.events_path)
    now = time.time()
    count = 0
    for u in range(users):
        user_id = f"demo-user-{u + 1:02d}"
        taste, level = TASTES[u % len(TASTES)]
        n_events = rng.randint(5, 25)
        for _ in range(n_events):
            if rng.random() < 0.72:
                pool = by_category.get(taste, catalog)
            else:
                pool = catalog
            item = rng.choice(pool)
            kind = rng.choice(KINDS)
            event: dict = {
                "user_id": user_id,
                "item_id": item["id"],
                "kind": kind,
                "ts": now - rng.randint(0, 60) * 86_400 - rng.randint(0, 86_400),
            }
            if kind == "rate":
                event["value"] = float(rng.randint(3, 5))
            store.append(event)
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--users", type=int, default=30)
    parser.add_argument("--reset", action="store_true", help="Delete existing events first")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    if args.reset and os.path.exists(SETTINGS.events_path):
        os.remove(SETTINGS.events_path)

    count = seed(args.users, args.seed)
    print(f"Seeded {count} events -> {SETTINGS.events_path}")
    print(run_training(SETTINGS))


if __name__ == "__main__":
    main()
