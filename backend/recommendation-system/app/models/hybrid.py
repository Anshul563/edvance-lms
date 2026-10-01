"""Hybrid blending (z-scored weighted sum) + MMR diversity reranking."""

from __future__ import annotations

import numpy as np


def _zscore(vec: np.ndarray) -> np.ndarray:
    std = float(np.std(vec))
    if std == 0.0:
        return np.zeros_like(vec)
    return (vec - float(np.mean(vec))) / std


def blend(
    cf: np.ndarray | None,
    content: np.ndarray,
    popularity: np.ndarray,
    w_cf: float,
    w_content: float,
    w_pop: float,
) -> np.ndarray:
    """Weighted sum of z-scored components into a single relevance vector."""
    total = max(w_cf + w_content + w_pop, 1e-9)
    out = (w_content / total) * _zscore(content) + (w_pop / total) * _zscore(
        popularity
    )
    if cf is not None and cf.shape == out.shape:
        out = out + (w_cf / total) * _zscore(cf)
    return out


def mmr_rerank(
    candidate_rows: list[int],
    scores: np.ndarray,
    sim_matrix: np.ndarray,
    top_k: int,
    lambda_: float = 0.7,
) -> list[int]:
    """Maximal Marginal Relevance: relevance minus redundancy to chosen set."""
    if not candidate_rows or top_k <= 0:
        return []
    remaining = list(candidate_rows)
    selected: list[int] = []
    lam = min(max(lambda_, 0.0), 1.0)
    while remaining and len(selected) < top_k:
        best_row = remaining[0]
        best_val = float("-inf")
        for row in remaining:
            redundancy = 0.0
            if selected:
                redundancy = float(
                    max(sim_matrix[row, picked] for picked in selected)
                )
            value = lam * float(scores[row]) - (1.0 - lam) * redundancy
            if value > best_val:
                best_val = value
                best_row = row
        selected.append(best_row)
        remaining.remove(best_row)
    return selected
