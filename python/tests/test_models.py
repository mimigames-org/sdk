"""Smoke tests for the canonical game-backend models."""

from __future__ import annotations

from mimigames_sdk import (
    CONTRACT_VERSION,
    ActionRequest,
    EndRequest,
    GameBackend,
    GameResponse,
    HealthResponse,
    Player,
    ScheduledBroadcast,
    StartRequest,
    TickRequest,
    ViewRequest,
    ViewResponse,
)


def test_defaults_construct() -> None:
    assert HealthResponse().status == "ok"
    assert HealthResponse().rooms is None
    assert HealthResponse().contract_version == CONTRACT_VERSION
    assert GameResponse().events == []
    assert GameResponse().public_delta == {}
    assert ViewResponse().public_state == {}


def test_contract_version_is_major_2() -> None:
    assert CONTRACT_VERSION == "2"


def test_action_request_sequence_id_optional() -> None:
    req = ActionRequest(room_id="r", player_id="p", action="move")
    assert req.sequence_id is None
    req2 = ActionRequest(room_id="r", player_id="p", action="move", sequence_id=7)
    assert req2.sequence_id == 7


def test_start_request_roundtrip() -> None:
    req = StartRequest(
        room_id="r1",
        players=[Player(id="p1", name="alice"), Player(id="p2", name="bob")],
        config={"mode": "fast"},
    )
    raw = req.model_dump_json()
    back = StartRequest.model_validate_json(raw)
    assert back == req


def test_tick_request_defaults() -> None:
    req = TickRequest(room_id="r1")
    assert req.now == 0.0
    assert req.tick_index == 0
    assert req.room_age_s == 0.0
    assert req.elapsed_s == 0.0


def test_game_response_with_events_roundtrip() -> None:
    resp = GameResponse(
        state={"turn": "p1"},
        events=[
            {"type": "phase_changed", "phase": "day"},
            {"type": "game_over", "winner_id": "p1"},
        ],
        next_tick_in=2.5,
        scheduled_broadcasts=[ScheduledBroadcast(delay_s=1.0)],
    )
    raw = resp.model_dump_json()
    back = GameResponse.model_validate_json(raw)
    assert back.next_tick_in == 2.5
    assert len(back.events) == 2
    assert back.events[0].type == "phase_changed"
    assert back.events[1].type == "game_over"


def test_protocol_runtime_satisfied() -> None:
    """A dummy class implementing every method instantiates and assigns
    to a `GameBackend`-typed variable at runtime. The *static* check that
    a class missing `on_view` is rejected is exercised out-of-tree by mypy.
    """

    class Dummy:
        async def on_health(self) -> HealthResponse:
            return HealthResponse()

        async def on_start(self, req: StartRequest) -> GameResponse:
            return GameResponse()

        async def on_action(self, req: ActionRequest) -> GameResponse:
            return GameResponse()

        async def on_view(self, req: ViewRequest) -> ViewResponse:
            return ViewResponse()

        async def on_tick(self, req: TickRequest) -> GameResponse:
            return GameResponse()

        async def on_end(self, req: EndRequest) -> None:
            return None

    backend: GameBackend = Dummy()
    assert backend is not None


if __name__ == "__main__":
    test_defaults_construct()
    test_contract_version_is_major_2()
    test_action_request_sequence_id_optional()
    test_start_request_roundtrip()
    test_tick_request_defaults()
    test_game_response_with_events_roundtrip()
    test_protocol_runtime_satisfied()
    print("ok")
