"""Time-decayed popularity + freshness + quality priors (cold-start backbone)."""

from __future__ import annotations

import math
import time

import numpy as np

from app.data.catalog import Catalog


def popularity_scores(
    catalog: Catalog,
    events: list[dict],
    weights: dict[str, float],
    now: float | None = None,
    half_life_days: float = 30.0,
    freshness_days: float = 21.0,
    freshness_weight: float = 0.6,
    quality_weight: float = 0.4,
) -> np.ndarray:
    """Per-item popularity score aligned to catalogue order."""
    now = now if now is not None else time.time()
    decay = math.log(2.0) / max(half_life_days * 86_400.0, 1.0)
    scores = np.zeros(len(catalog), dtype=np.float64)

    for event in events:
        row = catalog.row_of(str(event.get("item_id", "")))
        if row is None:
            continue
        weight = weights.get(str(event.get("kind", "view")), 0.0)
        if weight <= 0:
            continue
        age = max(now - float(event.get("ts", now)), 0.0)
        scores[row] += weight * math.exp(-decay * age)

    # Freshness prior so new items can surface without interactions.
    for row, item in enumerate(catalog.items):
        age_days = max(now - item.published_at, 0.0) / 86_400.0
        if age_days < freshness_days * 4:
            scores[row] += freshness_weight * math.exp(-age_days / freshness_days)
        # Quality prior: high ratings with social proof get a head start.
        if item.ratings_count > 0 and item.rating > 0:
            scores[row] += quality_weight * (item.rating / 5.0) * math.log10(
                1.0 + item.ratings_count
            )

    return scores
