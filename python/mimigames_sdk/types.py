"""Shared entities used across the game-backend HTTP contract."""

from __future__ import annotations

from pydantic import BaseModel

CONTRACT_VERSION = "2"
"""Major version of the game-backend HTTP contract implemented by this SDK.

Bumped to `"2"` alongside `ActionRequest.sequence_id`. Core rejects backends
whose `/health` reports a different major on registration (invariant #14).
"""


class Player(BaseModel):
    """A participant in a room."""

    id: str
    name: str


class HealthResponse(BaseModel):
    """Response shape for `GET /health`."""

    status: str = "ok"
    rooms: int | None = None
    contract_version: str = CONTRACT_VERSION


__all__ = ["CONTRACT_VERSION", "Player", "HealthResponse"]
