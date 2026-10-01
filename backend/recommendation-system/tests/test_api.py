"""API-level tests (ingest -> train -> recommend) with an isolated DATA_DIR."""

from __future__ import annotations

import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTOTRAIN_EVERY", "0")
    import app.config as config_module

    importlib.reload(config_module)
    import app.main as main_module

    importlib.reload(main_module)
    with TestClient(main_module.app) as test_client:
        yield test_client


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["items"] > 0


def test_recommend_flow(client):
    # Two users with opposite tastes.
    client.post("/events", json={"user_id": "dev", "item_id": "course-py-api", "kind": "complete"})
    client.post("/events", json={"user_id": "dev", "item_id": "video-profiling", "kind": "like"})
    client.post("/events", json={"user_id": "des", "item_id": "course-ui-systems", "kind": "complete"})
    client.post("/events", json={"user_id": "des", "item_id": "course-brand", "kind": "like"})

    train = client.post("/train")
    assert train.status_code == 200
    assert train.json()["users"] == 2

    dev = client.get("/recommendations", params={"user_id": "dev", "limit": 5}).json()
    des = client.get("/recommendations", params={"user_id": "des", "limit": 5}).json()
    assert len(dev) == 5 and len(des) == 5
    assert {r["item_id"] for r in dev} != {r["item_id"] for r in des}
    seen = {"course-py-api", "video-profiling"}
    assert not (seen & {r["item_id"] for r in dev})

    videos = client.get(
        "/recommendations", params={"user_id": "dev", "kind": "video", "limit": 10}
    ).json()
    assert videos and all(r["kind"] == "video" for r in videos)


def test_similar_and_profile(client):
    sim = client.get("/items/course-py-api/similar", params={"limit": 3}).json()
    assert len(sim) == 3
    assert all(r["item_id"] != "course-py-api" for r in sim)

    assert client.get("/items/nope/similar").status_code == 404

    profile = client.get("/users/nobody/profile").json()
    assert profile["is_cold_start"] is True

    bad = client.post(
        "/events", json={"user_id": "u", "item_id": "nope", "kind": "view"}
    )
    assert bad.status_code == 404

    bad_rate = client.post(
        "/events",
        json={"user_id": "u", "item_id": "course-py-api", "kind": "rate", "value": 9},
    )
    assert bad_rate.status_code == 422
