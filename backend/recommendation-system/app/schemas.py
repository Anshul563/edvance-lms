"""Pydantic contracts for the recommendation HTTP API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ItemKind = Literal["course", "video"]
EventKind = Literal["view", "like", "share", "enroll", "complete", "rate", "dislike", "skip"]


class EventIn(BaseModel):
    user_id: str = Field(min_length=1)
    item_id: str = Field(min_length=1)
    kind: EventKind
    value: float | None = Field(
        default=None,
        description="Rating value 1-5 for kind=rate; ignored otherwise.",
    )
    ts: float | None = Field(default=None, description="Unix timestamp; defaults to now.")


class RecommendResponse(BaseModel):
    item_id: str
    kind: str
    title: str
    score: float
    reasons: list[str] = []


class SimilarResponse(BaseModel):
    item_id: str
    kind: str
    title: str
    score: float


class UserProfileResponse(BaseModel):
    user_id: str
    interactions: int
    top_categories: list[tuple[str, float]]
    top_levels: list[tuple[str, float]]
    is_cold_start: bool


class TrainResponse(BaseModel):
    items: int
    users: int
    events: int
    als_factors: int
    message: str
