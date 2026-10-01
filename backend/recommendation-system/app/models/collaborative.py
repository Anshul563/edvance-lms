"""Implicit-feedback ALS (Hu–Koren–Volinsky) on numpy.

Confidence: c_ui = 1 + alpha * r_ui, preference p_ui = 1 iff interacted.
Alternating least squares with per-row exact solves.
"""

from __future__ import annotations

import numpy as np


class ImplicitALS:
    def __init__(
        self,
        factors: int = 32,
        regularization: float = 0.1,
        alpha: float = 40.0,
        iterations: int = 15,
        seed: int = 42,
    ):
        self.factors = factors
        self.reg = regularization
        self.alpha = alpha
        self.iters = iterations
        self.seed = seed
        self.user_factors: np.ndarray = np.zeros((0, factors))
        self.item_factors: np.ndarray = np.zeros((0, factors))

    def fit(
        self,
        n_users: int,
        n_items: int,
        triplets: list[tuple[int, int, float]],
    ) -> "ImplicitALS":
        rng = np.random.default_rng(self.seed)
        f = self.factors
        self.user_factors = rng.normal(0.0, 0.1, size=(n_users, f))
        self.item_factors = rng.normal(0.0, 0.1, size=(n_items, f))

        # Sparse-ish interaction lists per row.
        user_items: list[list[tuple[int, float]]] = [[] for _ in range(n_users)]
        item_users: list[list[tuple[int, float]]] = [[] for _ in range(n_items)]
        for u, i, w in triplets:
            if w <= 0 or not (0 <= u < n_users and 0 <= i < n_items):
                continue
            user_items[u].append((i, w))
            item_users[i].append((u, w))

        eye = np.eye(f) * self.reg
        for _ in range(self.iters):
            self._solve_all(
                self.user_factors, self.item_factors, user_items, eye
            )
            self._solve_all(
                self.item_factors, self.user_factors, item_users, eye
            )
        return self

    def _solve_all(
        self,
        target: np.ndarray,
        other: np.ndarray,
        interactions: list[list[tuple[int, float]]],
        eye: np.ndarray,
    ) -> None:
        other_t_other = other.T @ other
        for idx, pairs in enumerate(interactions):
            if not pairs:
                continue
            cols = np.array([p[0] for p in pairs], dtype=np.int64)
            conf = 1.0 + self.alpha * np.array([p[1] for p in pairs])
            feas = other[cols]  # (k, f)
            # A = Y^T Y + Y^T (C - I) Y ; b = Y^T C p  (p = 1 for observed)
            avec = feas * (conf - 1.0)[:, None]
            atop = other_t_other + feas.T @ avec + eye
            btop = (feas * conf[:, None]).sum(axis=0)
            try:
                target[idx] = np.linalg.solve(atop, btop)
            except np.linalg.LinAlgError:
                continue

    def user_scores(self, u_idx: int) -> np.ndarray | None:
        if not 0 <= u_idx < self.user_factors.shape[0]:
            return None
        return self.item_factors @ self.user_factors[u_idx]

    def item_similarity(self, i_idx: int) -> np.ndarray | None:
        if not 0 <= i_idx < self.item_factors.shape[0]:
            return None
        vec = self.item_factors[i_idx]
        norm = float(np.linalg.norm(vec))
        if norm == 0.0:
            return None
        norms = np.linalg.norm(self.item_factors, axis=1)
        norms[norms == 0.0] = 1.0
        return (self.item_factors @ vec) / (norms * norm)
