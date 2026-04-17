# mimigames-sdk (Python)

Canonical pydantic models and a `typing.Protocol` for the MimiGames
game-backend HTTP contract. Used by `mimigames:core` and by every game backend
(`watch-party`, `poker`, …) so that the shape of `/start`, `/action`, `/view`,
`/tick`, `/end` and `/health` is declared in exactly one place.

## Install

```bash
pip install 'mimigames-sdk @ git+https://github.com/mimigames-org/sdk.git@sdk-python-v0.1.0#subdirectory=python'
```

## Implement a backend

Any class that satisfies the `GameBackend` protocol is a valid backend — mypy
will warn if you forget a handler. Wire it up with your web framework of
choice (FastAPI, Starlette, …); the SDK itself has no runtime dependency on a
framework.

```python
from mimigames_sdk import (
    ActionRequest,
    EndRequest,
    GameBackend,
    GameResponse,
    HealthResponse,
    StartRequest,
    TickRequest,
    ViewRequest,
    ViewResponse,
)


class MyGame:
    async def on_health(self) -> HealthResponse:
        return HealthResponse(status="ok", rooms=0)

    async def on_start(self, req: StartRequest) -> GameResponse:
        return GameResponse(state={"turn": req.players[0].id})

    async def on_action(self, req: ActionRequest) -> GameResponse:
        return GameResponse(public_delta={"last_action": req.action})

    async def on_view(self, req: ViewRequest) -> ViewResponse:
        return ViewResponse(public_state={"room": req.room_id})

    async def on_tick(self, req: TickRequest) -> GameResponse:
        return GameResponse(next_tick_in=1.0)

    async def on_end(self, req: EndRequest) -> None:
        return None


# Static check (mypy will reject this assignment if a method is missing):
backend: GameBackend = MyGame()
```

## How to pin

The package is not published to PyPI. Pin by **git tag** — each release gets
an immutable tag of the form `sdk-python-vX.Y.Z`. The tag points at the commit
on the `sdk` repository that shipped that version.

```
# requirements.txt
mimigames-sdk @ git+https://github.com/mimigames-org/sdk.git@sdk-python-v0.1.0#subdirectory=python
```

```toml
# pyproject.toml (PEP 621)
[project]
dependencies = [
    "mimigames-sdk @ git+https://github.com/mimigames-org/sdk.git@sdk-python-v0.1.0#subdirectory=python",
]
```

Pinning to a branch (e.g. `@main`) is discouraged — it will resolve to a
moving target and break reproducibility.

## Reserved `public_delta` / `public_state` keys

See the root `README.md` of this repository for the list of keys the platform
itself reads/writes from `public_delta` and `public_state`. Games must not
collide with them.
