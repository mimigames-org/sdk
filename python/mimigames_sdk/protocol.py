"""Canonical request/response models and `GameBackend` Protocol."""

from __future__ import annotations

from typing import Annotated, Literal, Protocol

from pydantic import BaseModel, Field

from .types import HealthResponse, Player

# Alias for game backends that refer to participants as "PlayerInfo".
# Both names are exported; `Player` is the canonical type.
PlayerInfo = Player


# --- Requests (core -> backend) -------------------------------------------------


class StartRequest(BaseModel):
    """Payload for `POST /start`."""

    room_id: str
    players: list[Player]
    config: dict = Field(default_factory=dict)


class ActionRequest(BaseModel):
    """Payload for `POST /action`."""

    room_id: str
    player_id: str
    action: str
    payload: dict = Field(default_factory=dict)
    state: dict | None = None


class ViewRequest(BaseModel):
    """Payload for `POST /view`."""

    room_id: str
    player_id: str
    state: dict | None = None


class TickRequest(BaseModel):
    """Payload for `POST /tick`."""

    room_id: str
    now: float = 0.0
    tick_index: int = 0
    room_age_s: float = 0.0
    elapsed_s: float = 0.0


class EndRequest(BaseModel):
    """Payload for `POST /end`."""

    room_id: str


# --- Events --------------------------------------------------------------------


class GameOver(BaseModel):
    type: Literal["game_over"] = "game_over"
    winner_id: str | None = None


class PlayerEliminated(BaseModel):
    type: Literal["player_eliminated"] = "player_eliminated"
    player_id: str


class PhaseChanged(BaseModel):
    type: Literal["phase_changed"] = "phase_changed"
    phase: str


TickEvent = Annotated[
    GameOver | PlayerEliminated | PhaseChanged,
    Field(discriminator="type"),
]


class ScheduledBroadcast(BaseModel):
    """A delayed broadcast emitted from a tick response."""

    delay_s: float
    public_delta: dict = Field(default_factory=dict)
    private_deltas: dict[str, dict] = Field(default_factory=dict)


# --- Responses -----------------------------------------------------------------


class GameResponse(BaseModel):
    """Shared response shape for `/start`, `/action`, `/tick`."""

    state: dict | None = None
    public_delta: dict = Field(default_factory=dict)
    private_deltas: dict[str, dict] = Field(default_factory=dict)
    events: list[TickEvent] = Field(default_factory=list)
    # tick-only:
    next_tick_in: float | None = None
    scheduled_broadcasts: list[ScheduledBroadcast] | None = None


class ViewResponse(BaseModel):
    """Response for `/view` — snapshot shape for UI consumers."""

    public_state: dict = Field(default_factory=dict)
    private_state: dict = Field(default_factory=dict)


# --- Protocol ------------------------------------------------------------------


class GameBackend(Protocol):
    """Static contract each game backend must implement.

    Signatures are a guide for mypy and docs; the SDK does not enforce them at
    runtime (it has no knowledge of the web framework used by the backend).
    """

    async def on_health(self) -> HealthResponse: ...
    async def on_start(self, req: StartRequest) -> GameResponse: ...
    async def on_action(self, req: ActionRequest) -> GameResponse: ...
    async def on_view(self, req: ViewRequest) -> ViewResponse: ...
    async def on_tick(self, req: TickRequest) -> GameResponse: ...
    async def on_end(self, req: EndRequest) -> None: ...


__all__ = [
    "PlayerInfo",
    "StartRequest",
    "ActionRequest",
    "ViewRequest",
    "TickRequest",
    "EndRequest",
    "GameOver",
    "PlayerEliminated",
    "PhaseChanged",
    "TickEvent",
    "ScheduledBroadcast",
    "GameResponse",
    "ViewResponse",
    "GameBackend",
]
