"""Shared entities used across the game-backend HTTP contract."""

from __future__ import annotations

from pydantic import BaseModel


class Player(BaseModel):
    """A participant in a room."""

    id: str
    name: str


class HealthResponse(BaseModel):
    """Response shape for `GET /health`."""

    status: str = "ok"
    rooms: int | None = None


__all__ = ["Player", "HealthResponse"]
