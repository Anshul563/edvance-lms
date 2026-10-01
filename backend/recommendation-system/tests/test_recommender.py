"""Unit tests for the hybrid recommender (content + ALS + popularity + MMR)."""

from __future__ import annotations

import time

import numpy as np
import pytest

from app.config import Settings
from app.models.hybrid import mmr_rerank
from app.services.recommender import Recommender

NOW = time.time()
DAY = 86_400


def _catalog() -> list[dict]:
    def item(iid, kind, title, desc, category, **kw):
        base = {
            "id": iid,
            "kind": kind,
            "title": title,
            "description": desc,
            "category": category,
            "level": "beginner",
            "channel_id": "ch-1",
            "tags": [],
            "rating": 4.5,
            "ratings_count": 100,
            "views": 1000,
            "published_at": NOW - 100 * DAY,
            "status": "published",
        }
        base.update(kw)
        return base

    return [
        item("py-1", "course", "Python for APIs", "fastapi rest backend python", "Development"),
        item("py-2", "course", "Advanced Python Backend", "fastapi python servers asyncio", "Development"),
        item("py-3", "video", "Python Profiling Tricks", "profile python performance flame", "Development"),
        item("ds-1", "course", "Design Systems Basics", "figma tokens components ui", "Design"),
        item("ds-2", "video", "Figma Auto Layout", "figma layout components design", "Design"),
        item("sql-1", "course", "SQL Window Functions", "sql postgres analytics queries", "Data Science"),
    ]


def _settings(tmp_path, **overrides) -> Settings:
    return Settings(data_dir=str(tmp_path), **overrides)


def _rec(tmp_path, events: list[dict], **overrides) -> Recommender:
    rec = Recommender(_settings(tmp_path, **overrides), _catalog())
    for event in events:
        rec.store.append(event)
    rec.train()
    return rec


def _ev(user, item, kind="view", ts=None):
    return {"user_id": user, "item_id": item, "kind": kind, "ts": ts or NOW}


def test_content_similarity_groups_topics(tmp_path):
    rec = _rec(tmp_path, [])
    sims = rec.similar("py-1", limit=2)
    ids = [s.item_id for s in sims]
    assert set(ids) == {"py-2", "py-3"}


def test_content_personalizes_per_user(tmp_path):
    events = [
        _ev("u-dev", "py-1", "complete"),
        _ev("u-des", "ds-1", "complete"),
    ]
    rec = _rec(tmp_path, events, w_cf=0.0, w_pop=0.0, w_content=1.0)
    dev_top = [r.item_id for r in rec.recommend("u-dev", limit=3, diverse=False)]
    des_top = [r.item_id for r in rec.recommend("u-des", limit=3, diverse=False)]
    assert dev_top[0] in {"py-2", "py-3"}
    assert des_top[0] == "ds-2"
    assert dev_top != des_top


def test_cf_links_co_consumed_items(tmp_path):
    events = [
        _ev("u1", "py-1", "complete"),
        _ev("u1", "py-2", "complete"),
        _ev("u2", "py-2", "complete"),
        _ev("u2", "py-3", "complete"),
        _ev("u3", "ds-1", "complete"),
        _ev("u3", "ds-2", "complete"),
    ]
    rec = _rec(tmp_path, events)
    assert rec.als_trained
    sim = rec.als.item_similarity(rec.catalog.row_of("py-1"))  # type: ignore[union-attr]
    assert sim is not None
    py2 = rec.catalog.row_of("py-2")
    ds1 = rec.catalog.row_of("ds-1")
    assert py2 is not None and ds1 is not None
    assert float(sim[py2]) > float(sim[ds1])


def test_cold_start_returns_popular(tmp_path):
    rec = _rec(tmp_path, [])
    recs = rec.recommend("ghost", limit=3)
    assert len(recs) == 3
    assert any(r.reasons for r in recs)
    profile = rec.profile("ghost")
    assert profile["is_cold_start"] is True


def test_exclude_seen_and_dislike(tmp_path):
    events = [_ev("u1", "py-1"), _ev("u1", "py-2"), {"user_id": "u1", "item_id": "ds-1", "kind": "dislike", "ts": NOW}]
    rec = _rec(tmp_path, events)
    ids = [r.item_id for r in rec.recommend("u1", limit=10)]
    assert "py-1" not in ids and "py-2" not in ids and "ds-1" not in ids


def test_kind_filter(tmp_path):
    rec = _rec(tmp_path, [])
    recs = rec.recommend("ghost", kind="video", limit=10)
    assert recs and all(r.kind == "video" for r in recs)


def test_mmr_prefers_diversity():
    scores = np.array([1.0, 0.95, 0.5])
    sim = np.array(
        [
            [1.0, 0.99, 0.0],
            [0.99, 1.0, 0.0],
            [0.0, 0.0, 1.0],
        ]
    )
    picked = mmr_rerank([0, 1, 2], scores, sim, top_k=2, lambda_=0.5)
    assert picked[0] == 0
    assert picked[1] == 2  # near-duplicate 1 is skipped despite higher score


def test_reasons_reference_history(tmp_path):
    rec = _rec(tmp_path, [_ev("u1", "py-1", "complete")])
    recs = rec.recommend("u1", limit=3)
    assert any(
        any(reason.startswith("Because you engaged") for reason in r.reasons)
        for r in recs
    )


def test_profile_aggregation(tmp_path):
    rec = _rec(tmp_path, [_ev("u1", "py-1", "enroll"), _ev("u1", "ds-1")])
    profile = rec.profile("u1")
    assert profile["interactions"] == 2
    assert profile["top_categories"][0][0] == "Development"
    assert profile["is_cold_start"] is False
