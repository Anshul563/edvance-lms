"""Central configuration for the recommendation service (env-driven)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _get_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    port: int = field(default_factory=lambda: _get_int("PORT", 8000))
    data_dir: str = field(default_factory=lambda: os.getenv("DATA_DIR", "./data"))
    autotrain_every: int = field(default_factory=lambda: _get_int("AUTOTRAIN_EVERY", 200))
    redis_url: str = field(default_factory=lambda: os.getenv("REDIS_URL", ""))
    rec_cache_ttl: int = field(default_factory=lambda: _get_int("REC_CACHE_TTL", 120))

    als_factors: int = field(default_factory=lambda: _get_int("ALS_FACTORS", 32))
    als_reg: float = field(default_factory=lambda: _get_float("ALS_REG", 0.1))
    als_alpha: float = field(default_factory=lambda: _get_float("ALS_ALPHA", 40.0))
    als_iters: int = field(default_factory=lambda: _get_int("ALS_ITERS", 15))
    pop_half_life_days: float = field(
        default_factory=lambda: _get_float("POP_HALF_LIFE_DAYS", 30.0)
    )

    w_cf: float = field(default_factory=lambda: _get_float("W_CF", 0.45))
    w_content: float = field(default_factory=lambda: _get_float("W_CONTENT", 0.35))
    w_pop: float = field(default_factory=lambda: _get_float("W_POP", 0.20))
    mmr_lambda: float = field(default_factory=lambda: _get_float("MMR_LAMBDA", 0.7))

    @property
    def events_path(self) -> str:
        return os.path.join(self.data_dir, "events.jsonl")

    @property
    def artifacts_dir(self) -> str:
        return os.path.join(self.data_dir, "artifacts")


SETTINGS = Settings()
