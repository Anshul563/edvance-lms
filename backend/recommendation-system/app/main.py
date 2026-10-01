"""FastAPI front-end for the hybrid recommendation engine."""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Query

from app.config import SETTINGS
from app.data.demo_catalog import load_catalog
from app.schemas import EventIn, RecommendResponse, SimilarResponse, TrainResponse, UserProfileResponse
from app.services.recommender import Recommender
from app.services.trainer import run_training

try:
    import redis  # type: ignore

    _redis = (
        redis.Redis.from_url(SETTINGS.redis_url, decode_responses=True)
        if SETTINGS.redis_url
        else None
    )
except ImportError:  # redis is an optional dependency
    _redis = None

RECS: Recommender


@asynccontextmanager
async def lifespan(app: FastAPI):
    global RECS
    RECS = Recommender(SETTINGS, load_catalog())
    if not RECS.load():
        RECS.train()
        RECS.save()
    yield


app = FastAPI(title="Edvance Recommender", version="1.0.0", lifespan=lifespan)


def _cache_get(key: str) -> str | None:
    if _redis is None or SETTINGS.rec_cache_ttl <= 0:
        return None
    try:
        return _redis.get(key)
    except Exception:
        return None


def _cache_set(key: str, value: str) -> None:
    if _redis is None or SETTINGS.rec_cache_ttl <= 0:
        return
    try:
        _redis.setex(key, SETTINGS.rec_cache_ttl, value)
    except Exception:
        pass


def _cache_invalidate() -> None:
    if _redis is None:
        return
    try:
        for key in _redis.scan_iter("rec:*"):
            _redis.delete(key)
    except Exception:
        pass


@app.get("/health")
def health() -> dict:
    state = RECS.staleness()
    return {
        "status": "ok",
        "items": len(RECS.catalog),
        "users": len(RECS.user_index),
        **state,
        "now": time.time(),
    }


@app.post("/events")
def ingest_event(event: EventIn) -> dict:
    if event.kind == "rate" and event.value is not None and not 1.0 <= event.value <= 5.0:
        raise HTTPException(status_code=422, detail="rate value must be between 1 and 5")
    if event.item_id not in RECS.catalog.by_id:
        raise HTTPException(status_code=404, detail=f"unknown item {event.item_id}")
    result = RECS.ingest(event.model_dump())
    if result.get("retrained"):
        RECS.save()
        _cache_invalidate()
    return result


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    stats = run_training(SETTINGS)
    global RECS
    RECS = Recommender(SETTINGS, load_catalog())
    RECS.load()
    _cache_invalidate()
    return TrainResponse(**stats)


@app.get("/recommendations", response_model=list[RecommendResponse])
def recommendations(
    user_id: str = Query(min_length=1),
    kind: Literal["all", "course", "video"] = "all",
    limit: int = Query(default=10, ge=1, le=50),
    exclude_seen: bool = True,
    diverse: bool = True,
) -> list[RecommendResponse]:
    cache_key = f"rec:{user_id}:{kind}:{limit}:{int(exclude_seen)}:{int(diverse)}"
    cached = _cache_get(cache_key)
    if cached is not None:
        import json as _json

        return [RecommendResponse(**r) for r in _json.loads(cached)]
    recs = RECS.recommend(
        user_id,
        kind=None if kind == "all" else kind,
        limit=limit,
        exclude_seen=exclude_seen,
        diverse=diverse,
    )
    payload = [
        RecommendResponse(
            item_id=r.item_id, kind=r.kind, title=r.title, score=r.score, reasons=r.reasons
        )
        for r in recs
    ]
    import json as _json

    _cache_set(cache_key, _json.dumps([r.model_dump() for r in payload]))
    return payload


@app.get("/items/{item_id}/similar", response_model=list[SimilarResponse])
def similar(
    item_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    kind: Literal["all", "course", "video"] = "all",
) -> list[SimilarResponse]:
    if item_id not in RECS.catalog.by_id:
        raise HTTPException(status_code=404, detail=f"unknown item {item_id}")
    recs = RECS.similar(item_id, limit=limit, kind=None if kind == "all" else kind)
    return [
        SimilarResponse(item_id=r.item_id, kind=r.kind, title=r.title, score=r.score)
        for r in recs
    ]


@app.get("/users/{user_id}/profile", response_model=UserProfileResponse)
def user_profile(user_id: str) -> UserProfileResponse:
    return UserProfileResponse(**RECS.profile(user_id))
