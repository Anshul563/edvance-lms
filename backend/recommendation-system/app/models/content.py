"""TF-IDF content model implemented on numpy (no sklearn dependency)."""

from __future__ import annotations

import math
import re

import numpy as np

_TOKEN_RE = re.compile(r"[a-z0-9]+")

STOPWORDS = frozenset(
    """
    a an and are as at be by for from has he in is it its of on or that the
    to was will with this these those they them their there then than so such
    into over after before between through during without within about into
    your you we our us i me my him her his hers our ours your yours their theirs
    what which who whom how when where why can could should would may might must
    do does did done have had having not no yes if else nor own same too very
    all any both each few more most other some only just also well much many
    one two new using use used step steps learn learning course video lesson
    """.split()
)


def tokenize(text: str) -> list[str]:
    tokens = _TOKEN_RE.findall(text.lower())
    return [t for t in tokens if len(t) >= 2 and t not in STOPWORDS]


class TfidfVectorizer:
    """Sublinear-TF, smoothed-IDF vectorizer with L2-normalised rows."""

    def __init__(self, max_features: int = 5000, min_df: int = 1):
        self.max_features = max_features
        self.min_df = min_df
        self.vocab: dict[str, int] = {}
        self.idf: np.ndarray = np.zeros(0, dtype=np.float64)

    def fit(self, docs: list[str]) -> "TfidfVectorizer":
        df: dict[str, int] = {}
        for doc in docs:
            for token in set(tokenize(doc)):
                df[token] = df.get(token, 0) + 1
        kept = sorted(
            (t for t, c in df.items() if c >= self.min_df),
            key=lambda t: (-df[t], t),
        )[: self.max_features]
        self.vocab = {t: i for i, t in enumerate(kept)}
        n = max(len(docs), 1)
        self.idf = np.array(
            [math.log((n + 1) / (df[t] + 1)) + 1.0 for t in kept],
            dtype=np.float64,
        )
        return self

    def transform(self, docs: list[str]) -> np.ndarray:
        rows = np.zeros((len(docs), len(self.vocab)), dtype=np.float64)
        for r, doc in enumerate(docs):
            counts: dict[int, int] = {}
            for token in tokenize(doc):
                col = self.vocab.get(token)
                if col is not None:
                    counts[col] = counts.get(col, 0) + 1
            for col, count in counts.items():
                rows[r, col] = (1.0 + math.log(count)) * self.idf[col]
        norms = np.linalg.norm(rows, axis=1, keepdims=True)
        norms[norms == 0.0] = 1.0
        return rows / norms

    def fit_transform(self, docs: list[str]) -> np.ndarray:
        return self.fit(docs).transform(docs)


class ContentModel:
    """Item TF-IDF matrix + weighted-centroid user profiles."""

    def __init__(self, max_features: int = 5000):
        self.vectorizer = TfidfVectorizer(max_features=max_features)
        self.matrix: np.ndarray = np.zeros((0, 0))

    def fit(self, docs: list[str]) -> "ContentModel":
        self.matrix = self.vectorizer.fit_transform(docs)
        return self

    def profile(self, rows: list[int], weights: list[float]) -> np.ndarray | None:
        """Weighted centroid of interacted item vectors (L2-normalised)."""
        if not rows or self.matrix.shape[0] == 0:
            return None
        vec = np.zeros(self.matrix.shape[1], dtype=np.float64)
        for row, weight in zip(rows, weights):
            if 0 <= row < self.matrix.shape[0] and weight > 0:
                vec += self.matrix[row] * weight
        norm = float(np.linalg.norm(vec))
        if norm == 0.0:
            return None
        return vec / norm

    def scores(self, profile_vec: np.ndarray | None) -> np.ndarray:
        """Cosine scores against every item (profile already normalised)."""
        if profile_vec is None or self.matrix.shape[0] == 0:
            return np.zeros(self.matrix.shape[0], dtype=np.float64)
        return self.matrix @ profile_vec

    def item_similarity(self, row: int) -> np.ndarray:
        if not 0 <= row < self.matrix.shape[0]:
            return np.zeros(self.matrix.shape[0], dtype=np.float64)
        return self.matrix @ self.matrix[row]
