"""mimigames-sdk — canonical models and Protocol for the game-backend HTTP contract."""

from .protocol import (
    ActionRequest,
    EndRequest,
    GameBackend,
    GameOver,
    GameResponse,
    PhaseChanged,
    PlayerEliminated,
    ScheduledBroadcast,
    StartRequest,
    TickEvent,
    TickRequest,
    ViewRequest,
    ViewResponse,
)
from .types import HealthResponse, Player

__version__ = "0.1.0"

__all__ = [
    "ActionRequest",
    "EndRequest",
    "GameBackend",
    "GameOver",
    "GameResponse",
    "HealthResponse",
    "PhaseChanged",
    "Player",
    "PlayerEliminated",
    "ScheduledBroadcast",
    "StartRequest",
    "TickEvent",
    "TickRequest",
    "ViewRequest",
    "ViewResponse",
]
