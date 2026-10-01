# Edvance Recommendation System

Advanced hybrid recommendation service (Python + FastAPI) for courses and
standalone videos. Combines three signals, reranks for diversity, and explains
every suggestion.

## How it works

```
events (view/like/enroll/complete/rate/...) ─┐
                                             ├─► blend ─► MMR ─► ranked recs + reasons
catalogue (courses + videos, TF-IDF text) ───┘
```

| Signal | Model | File |
| --- | --- | --- |
| Collaborative | Implicit-feedback ALS (Hu–Koren–Volinsky), from scratch on numpy | `app/models/collaborative.py` |
| Content-based | TF-IDF (sublinear TF, smoothed IDF) + weighted user centroid | `app/models/content.py` |
| Popularity | Time-decayed interaction mass + freshness + rating priors (cold start) | `app/models/popularity.py` |
| Fusion | Z-scored weighted sum (`W_CF/W_CONTENT/W_POP`) + MMR diversity rerank | `app/models/hybrid.py` |

Business rules: seen items excluded (optional), dislikes always suppressed,
per-kind filtering, unpublished catalogue rows never surface.

## Quickstart

```bash
cp .env.example .env
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Seed demo users + interactions, then train:
python scripts/seed_demo.py --users 30 --reset

# Serve:
uvicorn app.main:app --port 8000
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Status, catalogue size, training staleness |
| POST | `/events` | Ingest `{user_id, item_id, kind, value?, ts?}`; auto-retrains every `AUTOTRAIN_EVERY` events |
| POST | `/train` | Full retrain + persist artifacts |
| GET | `/recommendations?user_id=&kind=all\|course\|video&limit=&exclude_seen=&diverse=` | Ranked recs with `score` + `reasons` |
| GET | `/items/{id}/similar?limit=&kind=` | Content (60%) + latent (40%) neighbours |
| GET | `/users/{id}/profile` | Top categories/levels, cold-start flag |

Interaction weights: `view 1 · like 2.5 · share 3 · complete 4 · enroll 5 ·
rate 1–5 · skip/dislike → suppress only`.

## Wiring a real catalogue

Replace `app/data/demo_catalog.py::load_catalog()` with a loader that selects
published rows from Postgres (`courses` + `lesson_videos`/`channels`), keeping
the same dict shape. Event kinds map 1:1 to app analytics events.

## Configuration

All via env (see `.env.example`): `PORT`, `DATA_DIR`, `AUTOTRAIN_EVERY`,
`REDIS_URL`/`REC_CACHE_TTL` (optional response cache), `ALS_*`, `W_*`,
`MMR_LAMBDA`, `POP_HALF_LIFE_DAYS`.

## Docker

```bash
docker build -t edvance-recommender .
docker run -p 8000:8000 -v rec-data:/app/data edvance-recommender
```

A `recommender` service is also wired into `backend/docker-compose.yml`.

## Tests

```bash
pytest
```
