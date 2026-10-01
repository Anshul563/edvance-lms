"""Demo catalogue mirroring the Edvance domain (courses + standalone videos).

Used when no external catalogue is wired up. In production, replace
``load_catalog()`` with a loader that pulls published courses/videos from
Postgres (courses / lesson_videos tables) and channels.
"""

from __future__ import annotations

import time

DAY = 86_400
NOW = time.time()

# (id, kind, title, description, category, level, channel, tags, rating, ratings, views, age_days)
_RAW: list[tuple] = [
    (
        "course-py-api", "course", "REST APIs with Python & FastAPI",
        "Design, build and document production REST APIs with FastAPI, pydantic validation and background workers.",
        "Development", "intermediate", "channel-backend", ("python", "fastapi", "rest", "backend"),
        4.8, 2314, 184002, 210,
    ),
    (
        "course-react-native", "course", "React Native from Zero to Store",
        "Cross-platform mobile apps with Expo Router, native modules and over-the-air updates.",
        "Development", "beginner", "channel-mobile", ("react-native", "expo", "mobile", "typescript"),
        4.7, 1893, 142500, 320,
    ),
    (
        "course-ml-practice", "course", "Machine Learning in Practice",
        "Regression to deployment: scikit-learn pipelines, model evaluation and serving with FastAPI.",
        "Data Science", "intermediate", "channel-data", ("ml", "python", "sklearn", "deployment"),
        4.9, 3102, 220400, 150,
    ),
    (
        "course-ui-systems", "course", "Design Systems that Scale",
        "Tokens, theming and component APIs for consistent product interfaces across platforms.",
        "Design", "intermediate", "channel-design", ("design-system", "figma", "tokens", "ui"),
        4.6, 1204, 96400, 260,
    ),
    (
        "course-sql", "course", "SQL for Data Work",
        "Joins, window functions and query plans for analytics and backend developers.",
        "Data Science", "beginner", "channel-data", ("sql", "postgres", "analytics"),
        4.7, 2210, 175300, 400,
    ),
    (
        "course-growth", "course", "Growth Marketing Foundations",
        "Funnels, lifecycle email and experiment design for early-stage products.",
        "Marketing", "beginner", "channel-growth", ("marketing", "seo", "email", "experiments"),
        4.5, 864, 68900, 180,
    ),
    (
        "course-k8s", "course", "Kubernetes for Developers",
        "Deployments, services and autoscaling without becoming a cluster admin.",
        "Development", "advanced", "channel-backend", ("kubernetes", "docker", "devops"),
        4.6, 1430, 110200, 90,
    ),
    (
        "course-motion", "course", "Motion Design for Apps",
        "Micro-interactions, spring physics and choreographed transitions with Reanimated.",
        "Design", "advanced", "channel-design", ("animation", "reanimated", "ux", "mobile"),
        4.7, 642, 48100, 45,
    ),
    (
        "course-finance", "course", "Startup Finance Essentials",
        "Runway, unit economics and pricing for non-finance founders.",
        "Business", "beginner", "channel-business", ("finance", "pricing", "startups"),
        4.4, 512, 39700, 300,
    ),
    (
        "course-leadership", "course", "Engineering Leadership",
        "Feedback, roadmaps and hiring loops for new engineering managers.",
        "Business", "intermediate", "channel-business", ("leadership", "management", "hiring"),
        4.8, 977, 74300, 120,
    ),
    (
        "course-nlp", "course", "NLP with Transformers",
        "Fine-tune transformer models for classification, retrieval and RAG pipelines.",
        "Data Science", "advanced", "channel-data", ("nlp", "transformers", "python", "rag"),
        4.9, 1754, 132600, 60,
    ),
    (
        "course-brand", "course", "Brand Identity Sprint",
        "A two-week process for naming, logo systems and launch-ready brand kits.",
        "Design", "beginner", "channel-design", ("branding", "logo", "identity"),
        4.5, 433, 32800, 25,
    ),
    (
        "video-expo-setup", "video", "Expo SDK Setup in 10 Minutes",
        "Fresh project to simulator with EAS dev builds explained step by step.",
        "Development", "beginner", "channel-mobile", ("expo", "react-native", "setup"),
        4.6, 320, 24500, 12,
    ),
    (
        "video-profiling", "video", "Finding Slow Code with Profilers",
        "Measure first: CPU profiles, flame graphs and fixing the real hotspot.",
        "Development", "intermediate", "channel-backend", ("profiling", "python", "performance"),
        4.8, 410, 31200, 30,
    ),
    (
        "video-rag", "video", "RAG Pipelines Explained Visually",
        "Chunking, embeddings and retrieval loops drawn out on a whiteboard.",
        "Data Science", "intermediate", "channel-data", ("rag", "embeddings", "nlp"),
        4.9, 520, 44800, 8,
    ),
    (
        "video-pricing", "video", "Pricing Pages that Convert",
        "Teardown of pricing tiers, anchoring and plan names that sell.",
        "Marketing", "beginner", "channel-growth", ("pricing", "conversion", "ux"),
        4.5, 180, 15600, 50,
    ),
    (
        "video-anim", "video", "Spring Animations that Feel Native",
        "Stiffness, damping and gesture-driven motion for mobile interfaces.",
        "Design", "intermediate", "channel-design", ("animation", "mobile", "ux"),
        4.7, 290, 22100, 20,
    ),
    (
        "video-sql-window", "video", "Window Functions in 15 Minutes",
        "ROW_NUMBER, RANK and running totals with real analytics queries.",
        "Data Science", "beginner", "channel-data", ("sql", "analytics", "postgres"),
        4.8, 610, 52300, 70,
    ),
    (
        "video-freelance", "video", "First Freelance Client Playbook",
        "Outreach scripts, scoping calls and contracts for designers.",
        "Business", "beginner", "channel-business", ("freelance", "clients", "design"),
        4.4, 150, 12900, 90,
    ),
    (
        "video-docker", "video", "Docker Layer Caching Demystified",
        "Why rebuilds are slow and the two-line fix that speeds them up.",
        "Development", "intermediate", "channel-backend", ("docker", "devops", "performance"),
        4.7, 380, 28700, 40,
    ),
]


def load_catalog() -> list[dict]:
    """Return the demo catalogue as plain item dicts."""
    items: list[dict] = []
    for raw in _RAW:
        (item_id, kind, title, desc, category, level, channel, tags,
         rating, ratings, views, age_days) = raw
        items.append(
            {
                "id": item_id,
                "kind": kind,
                "title": title,
                "description": desc,
                "category": category,
                "level": level,
                "channel_id": channel,
                "tags": list(tags),
                "rating": rating,
                "ratings_count": ratings,
                "views": views,
                "published_at": NOW - age_days * DAY,
                "status": "published",
            }
        )
    return items
