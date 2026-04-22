"""mimigames-sdk — canonical models and Protocol for the game-backend HTTP contract."""

from .protocol import (
    ActionRequest,
    EndRequest,
    GameBackend,
    GameOver,
    GameResponse,
    PhaseChanged,
    PlayerEliminated,
    PlayerInfo,
    ScheduledBroadcast,
    StartRequest,
    TickEvent,
    TickRequest,
    ViewRequest,
    ViewResponse,
)
from .types import CONTRACT_VERSION, HealthResponse, Player

__version__ = "0.2.0"

__all__ = [
    "ActionRequest",
    "CONTRACT_VERSION",
    "EndRequest",
    "GameBackend",
    "GameOver",
    "GameResponse",
    "HealthResponse",
    "PhaseChanged",
    "Player",
    "PlayerEliminated",
    "PlayerInfo",
    "ScheduledBroadcast",
    "StartRequest",
    "TickEvent",
    "TickRequest",
    "ViewRequest",
    "ViewResponse",
]
