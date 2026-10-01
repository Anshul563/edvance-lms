"""Append-only interaction event store (JSONL) with thread-safe access."""

from __future__ import annotations

import json
import os
import threading
import time


class EventStore:
    """Stores raw interaction events; training aggregates them on demand."""

    def __init__(self, path: str):
        self.path = path
        self._lock = threading.Lock()
        self._events: list[dict] = []
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.path):
            return
        with open(self.path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    self._events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    def append(self, event: dict) -> dict:
        record = {
            "user_id": str(event["user_id"]),
            "item_id": str(event["item_id"]),
            "kind": str(event.get("kind", "view")),
            "value": event.get("value"),
            "ts": float(event.get("ts") or time.time()),
        }
        os.makedirs(os.path.dirname(os.path.abspath(self.path)), exist_ok=True)
        with self._lock:
            with open(self.path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(record) + "\n")
            self._events.append(record)
        return record

    def all(self) -> list[dict]:
        with self._lock:
            return list(self._events)

    def for_user(self, user_id: str) -> list[dict]:
        with self._lock:
            return [e for e in self._events if e["user_id"] == user_id]

    def count(self) -> int:
        with self._lock:
            return len(self._events)
