"""In-memory item catalogue with text assembly for content modelling."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Item:
    id: str
    kind: str
    title: str
    description: str = ""
    category: str = "General"
    level: str = "all_levels"
    channel_id: str = ""
    tags: list[str] = field(default_factory=list)
    rating: float = 0.0
    ratings_count: int = 0
    views: int = 0
    published_at: float = 0.0
    status: str = "published"

    def text(self) -> str:
        """Weighted text: title/category/tags repeat for emphasis."""
        parts = [
            self.title,
            self.title,
            self.category,
            self.category,
            self.level.replace("_", " "),
            *self.tags,
            *self.tags,
            self.description,
        ]
        return " ".join(p for p in parts if p)


class Catalog:
    def __init__(self, raw_items: list[dict]):
        self.items: list[Item] = []
        self.by_id: dict[str, Item] = {}
        for raw in raw_items:
            if raw.get("status", "published") != "published":
                continue
            item = Item(
                id=str(raw["id"]),
                kind=str(raw.get("kind", "course")),
                title=str(raw.get("title", "")),
                description=str(raw.get("description", "")),
                category=str(raw.get("category", "General")),
                level=str(raw.get("level", "all_levels")),
                channel_id=str(raw.get("channel_id", "")),
                tags=[str(t) for t in raw.get("tags", [])],
                rating=float(raw.get("rating", 0.0)),
                ratings_count=int(raw.get("ratings_count", 0)),
                views=int(raw.get("views", 0)),
                published_at=float(raw.get("published_at", 0.0)),
                status=str(raw.get("status", "published")),
            )
            self.items.append(item)
            self.by_id[item.id] = item
        self.row: dict[str, int] = {item.id: i for i, item in enumerate(self.items)}

    def __len__(self) -> int:
        return len(self.items)

    def row_of(self, item_id: str) -> int | None:
        return self.row.get(item_id)

    def texts(self) -> list[str]:
        return [item.text() for item in self.items]

    def of_kind(self, kind: str | None) -> list[int]:
        if kind in (None, "all"):
            return list(range(len(self.items)))
        return [i for i, item in enumerate(self.items) if item.kind == kind]
