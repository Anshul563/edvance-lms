"""Offline training entrypoint: catalogue + event log -> fitted artifacts."""

from __future__ import annotations

from app.config import Settings
from app.data.demo_catalog import load_catalog
from app.services.recommender import Recommender


def run_training(settings: Settings) -> dict:
    recommender = Recommender(settings, load_catalog())
    stats = recommender.train()
    recommender.save()
    return {
        **stats,
        "als_factors": settings.als_factors,
        "message": f"Trained on {stats['events']} events for {stats['users']} users.",
    }


if __name__ == "__main__":
    from app.config import SETTINGS

    print(run_training(SETTINGS))
