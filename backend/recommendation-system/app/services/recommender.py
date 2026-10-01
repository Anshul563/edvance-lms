"""Hybrid recommender orchestrator: candidates -> blend -> MMR -> reasons."""

from __future__ import annotations

import json
import os
import threading
import time
from dataclasses import dataclass, field

import numpy as np

from app.config import Settings
from app.data.catalog import Catalog
from app.data.store import EventStore
from app.models.collaborative import ImplicitALS
from app.models.content import ContentModel
from app.models.hybrid import blend, mmr_rerank
from app.models.popularity import popularity_scores

# Implicit-feedback weights per interaction kind. `rate` uses the 1-5 value,
# `dislike`/`skip` never train the models — they only suppress the item.
EVENT_WEIGHTS: dict[str, float] = {
    "view": 1.0,
    "like": 2.5,
    "share": 3.0,
    "enroll": 5.0,
    "complete": 4.0,
    "skip": 0.0,
    "dislike": 0.0,
}

FRESH_DAYS = 21.0


def event_weight(event: dict) -> float:
    kind = str(event.get("kind", "view"))
    if kind == "rate":
        try:
            return min(max(float(event.get("value", 0.0)), 0.0), 5.0)
        except (TypeError, ValueError):
            return 0.0
    return EVENT_WEIGHTS.get(kind, 0.0)


@dataclass
class Recommendation:
    item_id: str
    kind: str
    title: str
    score: float
    reasons: list[str] = field(default_factory=list)


class Recommender:
    def __init__(self, settings: Settings, catalog_raw: list[dict]):
        self.settings = settings
        self.catalog = Catalog(catalog_raw)
        self.store = EventStore(settings.events_path)
        self.content = ContentModel()
        self.als = ImplicitALS(
            factors=settings.als_factors,
            regularization=settings.als_reg,
            alpha=settings.als_alpha,
            iterations=settings.als_iters,
        )
        self.user_index: dict[str, int] = {}
        self.pop: np.ndarray = np.zeros(len(self.catalog))
        self.content_sim: np.ndarray = np.zeros((len(self.catalog), len(self.catalog)))
        self.als_trained = False
        self.trained_at: float = 0.0
        self.event_count_at_train = 0
        self._lock = threading.RLock()

    # ------------------------------------------------------------------ train
    def train(self) -> dict:
        with self._lock:
            events = self.store.all()
            self.content.fit(self.catalog.texts())
            self.content_sim = self.content.matrix @ self.content.matrix.T

            triplets: list[tuple[int, int, float]] = []
            users: dict[str, int] = {}
            for event in events:
                row = self.catalog.row_of(str(event.get("item_id", "")))
                weight = event_weight(event)
                if row is None or weight <= 0:
                    continue
                user_id = str(event["user_id"])
                if user_id not in users:
                    users[user_id] = len(users)
                triplets.append((users[user_id], row, weight))

            self.user_index = users
            self.als_trained = False
            if len(users) >= 2 and len(self.catalog) >= 2 and triplets:
                self.als.fit(len(users), len(self.catalog), triplets)
                self.als_trained = True

            self.pop = popularity_scores(
                self.catalog,
                events,
                EVENT_WEIGHTS,
                half_life_days=self.settings.pop_half_life_days,
            )
            self.trained_at = time.time()
            self.event_count_at_train = len(events)
            return {
                "items": len(self.catalog),
                "users": len(users),
                "events": len(events),
            }

    # --------------------------------------------------------------- recommend
    def recommend(
        self,
        user_id: str,
        kind: str | None = None,
        limit: int = 10,
        exclude_seen: bool = True,
        diverse: bool = True,
    ) -> list[Recommendation]:
        with self._lock:
            if len(self.catalog) == 0:
                return []
            user_events = [e for e in self.store.all() if e["user_id"] == user_id]
            seen = {self.catalog.row_of(str(e["item_id"])) for e in user_events}
            seen.discard(None)
            disliked = {
                self.catalog.row_of(str(e["item_id"]))
                for e in user_events
                if str(e.get("kind")) == "dislike"
            }
            disliked.discard(None)

            rows = [r for r in self.catalog.of_kind(kind) if r is not None]
            if exclude_seen:
                rows = [r for r in rows if r not in seen]
            rows = [r for r in rows if r not in disliked]
            if not rows:
                return []

            cf_scores: np.ndarray | None = None
            u_idx = self.user_index.get(user_id)
            if u_idx is not None and self.als_trained:
                cf_scores = self.als.user_scores(u_idx)

            pos_rows = [
                self.catalog.row_of(str(e["item_id"]))
                for e in user_events
                if event_weight(e) > 0
            ]
            pos_rows = [r for r in pos_rows if r is not None]
            pos_weights = [
                event_weight(e) for e in user_events if event_weight(e) > 0
            ][: len(pos_rows)]
            profile = self.content.profile(pos_rows, pos_weights)
            content_scores = self.content.scores(profile)

            scores = blend(
                cf_scores,
                content_scores,
                self.pop,
                self.settings.w_cf,
                self.settings.w_content,
                self.settings.w_pop,
            )

            ordered = sorted(rows, key=lambda r: float(scores[r]), reverse=True)
            pool = ordered[: max(limit * 3, limit)]
            if diverse and len(pool) > 1:
                picked = mmr_rerank(
                    pool, scores, self.content_sim, limit, self.settings.mmr_lambda
                )
            else:
                picked = pool[:limit]

            now = time.time()
            pop_order = set(np.argsort(-self.pop)[: max(3, len(self.catalog) // 10)])
            out: list[Recommendation] = []
            for row in picked:
                item = self.catalog.items[row]
                reasons: list[str] = []
                if pos_rows:
                    best = max(pos_rows, key=lambda r: float(self.content_sim[row, r]))
                    if float(self.content_sim[row, best]) > 0.15:
                        reasons.append(
                            f"Because you engaged with '{self.catalog.items[best].title}'"
                        )
                if u_idx is not None and self.als_trained:
                    reasons.append("Learners with similar taste chose this")
                if row in pop_order:
                    reasons.append(f"Popular in {item.category}")
                age_days = (now - item.published_at) / 86_400.0 if item.published_at else 1e9
                if age_days < FRESH_DAYS:
                    reasons.append("Recently added")
                out.append(
                    Recommendation(
                        item_id=item.id,
                        kind=item.kind,
                        title=item.title,
                        score=round(float(scores[row]), 4),
                        reasons=reasons[:2],
                    )
                )
            return out

    # ---------------------------------------------------------------- similar
    def similar(
        self, item_id: str, limit: int = 10, kind: str | None = None
    ) -> list[Recommendation]:
        with self._lock:
            row = self.catalog.row_of(item_id)
            if row is None:
                return []
            content_sim = self.content.item_similarity(row)
            latent = self.als.item_similarity(row) if self.als_trained else None
            if latent is not None:
                combined = 0.6 * content_sim + 0.4 * np.nan_to_num(latent)
            else:
                combined = content_sim
            candidates = [r for r in self.catalog.of_kind(kind) if r != row]
            ranked = sorted(candidates, key=lambda r: float(combined[r]), reverse=True)
            out: list[Recommendation] = []
            for cand in ranked[:limit]:
                item = self.catalog.items[cand]
                out.append(
                    Recommendation(
                        item_id=item.id,
                        kind=item.kind,
                        title=item.title,
                        score=round(float(combined[cand]), 4),
                        reasons=[f"Similar to '{self.catalog.items[row].title}'"],
                    )
                )
            return out

    # ---------------------------------------------------------------- profile
    def profile(self, user_id: str) -> dict:
        with self._lock:
            events = [e for e in self.store.all() if e["user_id"] == user_id]
            cat_w: dict[str, float] = {}
            lvl_w: dict[str, float] = {}
            for event in events:
                item = self.catalog.by_id.get(str(event.get("item_id", "")))
                weight = event_weight(event)
                if item is None or weight <= 0:
                    continue
                cat_w[item.category] = cat_w.get(item.category, 0.0) + weight
                lvl_w[item.level] = lvl_w.get(item.level, 0.0) + weight
            top_cats = sorted(cat_w.items(), key=lambda kv: kv[1], reverse=True)[:5]
            top_lvls = sorted(lvl_w.items(), key=lambda kv: kv[1], reverse=True)[:3]
            return {
                "user_id": user_id,
                "interactions": len(events),
                "top_categories": [(c, round(w, 2)) for c, w in top_cats],
                "top_levels": [(lv, round(w, 2)) for lv, w in top_lvls],
                "is_cold_start": len(events) == 0,
            }

    # ----------------------------------------------------------------- ingest
    def ingest(self, event: dict) -> dict:
        with self._lock:
            record = self.store.append(event)
            total = self.store.count()
            every = self.settings.autotrain_every
            if every > 0 and total % every == 0:
                self.train()
                return {"accepted": True, "retrained": True}
            return {"accepted": True, "retrained": False}

    # ------------------------------------------------------------- persistence
    def save(self) -> None:
        with self._lock:
            os.makedirs(self.settings.artifacts_dir, exist_ok=True)
            np.savez_compressed(
                os.path.join(self.settings.artifacts_dir, "factors.npz"),
                user_factors=self.als.user_factors,
                item_factors=self.als.item_factors,
                content_matrix=self.content.matrix,
                pop=self.pop,
            )
            meta = {
                "users": self.user_index,
                "items": [item.id for item in self.catalog.items],
                "vocab": self.content.vectorizer.vocab,
                "idf": self.content.vectorizer.idf.tolist(),
                "als_trained": self.als_trained,
                "trained_at": self.trained_at,
                "event_count_at_train": self.event_count_at_train,
            }
            with open(
                os.path.join(self.settings.artifacts_dir, "meta.json"),
                "w",
                encoding="utf-8",
            ) as fh:
                json.dump(meta, fh)

    def load(self) -> bool:
        meta_path = os.path.join(self.settings.artifacts_dir, "meta.json")
        npz_path = os.path.join(self.settings.artifacts_dir, "factors.npz")
        if not (os.path.exists(meta_path) and os.path.exists(npz_path)):
            return False
        try:
            with open(meta_path, "r", encoding="utf-8") as fh:
                meta = json.load(fh)
            if meta.get("items") != [item.id for item in self.catalog.items]:
                return False  # Catalogue changed -> must retrain.
            data = np.load(npz_path, allow_pickle=False)
            with self._lock:
                self.user_index = {str(k): int(v) for k, v in meta["users"].items()}
                self.content.matrix = data["content_matrix"]
                self.content.vectorizer.vocab = {str(k): int(v) for k, v in meta["vocab"].items()}
                self.content.vectorizer.idf = np.array(meta["idf"], dtype=np.float64)
                self.content_sim = self.content.matrix @ self.content.matrix.T
                self.als.user_factors = data["user_factors"]
                self.als.item_factors = data["item_factors"]
                self.als.factors = self.als.item_factors.shape[1]
                self.pop = data["pop"]
                self.als_trained = bool(meta.get("als_trained", False))
                self.trained_at = float(meta.get("trained_at", 0.0))
                self.event_count_at_train = int(meta.get("event_count_at_train", 0))
            return True
        except (OSError, ValueError, KeyError):
            return False

    def staleness(self) -> dict:
        with self._lock:
            pending = self.store.count() - self.event_count_at_train
            return {
                "trained_at": self.trained_at,
                "events_at_train": self.event_count_at_train,
                "events_now": self.store.count(),
                "pending_events": max(pending, 0),
                "als_trained": self.als_trained,
            }
