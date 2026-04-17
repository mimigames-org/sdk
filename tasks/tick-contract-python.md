# Task: Canonical Python protocol for the game-backend interface

**Umbrella**: `mimigames-org/meta` — «Generalize tick interface»
**Branch**: `claude/generalize-tick-interface-5fK55`
**Depends on**: none (foundation)

## Scope note

После более широкого анализа задача расширена со «только tick» до **всего
HTTP-контракта** между `mimigames-org/mimigames:core` и игровыми бэкендами.
Tick — одна из 6 ручек и ровно те же проблемы дублирования/неформальности
есть в каждой из них. Филнейм файла оставлен прежним, чтобы не плодить
мёртвые ссылки из уже созданных issues.

## Context

Сегодня между `core/router.py` + `core/ticker.py` и каждым бэкендом
(`watch-party`, `poker`) ходят 6 HTTP-ручек с нетипизированными JSON-словарями:

| Endpoint | Направление | Request (сегодня)              | Response (сегодня)                                         |
|----------|-------------|--------------------------------|------------------------------------------------------------|
| `GET /health`  | core→be | —                              | `{status, …}`                                              |
| `POST /start`  | core→be | `{room_id, players, config}`   | `{state, public_delta, private_deltas, events}`            |
| `POST /action` | core→be | `{room_id, player_id, action, payload, state}` | `{state, public_delta, private_deltas, events}` |
| `POST /view`   | core→be | `{room_id, player_id, state}`  | `{public_state, private_state, …}` (watch-party +`stream_token`) |
| `POST /tick`   | core→be | `{room_id}` (+ расширяется)    | `{state, public_delta, private_deltas, events}`            |
| `POST /end`    | core→be | `{room_id}`                    | `204`                                                      |

Каждый бэкенд переопределяет pydantic-модели локально, возврат — `dict` без
валидации. `/view` возвращает другую форму чем остальные (`public_state` vs
`state`). `/end` в poker отсутствует; watch-party у него есть.

## Scope

Создать Python-подпакет `mimigames-sdk` в `python/` с каноническими pydantic-
моделями для **всех** endpoint-ов, и `typing.Protocol` для статической проверки
бэкендов на соответствие.

### Файлы

- `python/pyproject.toml` — пакет `mimigames-sdk` v0.1.0, deps: `pydantic>=2`.
- `python/mimigames_sdk/__init__.py` — реэкспорт.
- `python/mimigames_sdk/types.py` — общие сущности.
- `python/mimigames_sdk/protocol.py` — модели запросов/ответов + `GameBackend`.
- `python/README.md` — примеры использования.

### Модели

```python
# types.py
from pydantic import BaseModel

class Player(BaseModel):
    id: str
    name: str

class HealthResponse(BaseModel):
    status: str = "ok"
    rooms: int | None = None

# protocol.py — requests
class StartRequest(BaseModel):
    room_id: str
    players: list[Player]
    config: dict = {}

class ActionRequest(BaseModel):
    room_id: str
    player_id: str
    action: str
    payload: dict = {}
    state: dict | None = None

class ViewRequest(BaseModel):
    room_id: str
    player_id: str
    state: dict | None = None

class TickRequest(BaseModel):
    room_id: str
    now: float = 0.0
    tick_index: int = 0
    room_age_s: float = 0.0
    elapsed_s: float = 0.0

class EndRequest(BaseModel):
    room_id: str
```

```python
# protocol.py — events
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
    delay_s: float
    public_delta: dict = {}
    private_deltas: dict[str, dict] = {}
```

```python
# protocol.py — responses
class GameResponse(BaseModel):
    """Общая форма ответа для /start /action /tick."""
    state: dict | None = None
    public_delta: dict = {}
    private_deltas: dict[str, dict] = {}
    events: list[TickEvent] = []
    # только tick может выставить:
    next_tick_in: float | None = None
    scheduled_broadcasts: list[ScheduledBroadcast] | None = None

class ViewResponse(BaseModel):
    """Ответ на /view — отдельная форма, снапшот для UI."""
    public_state: dict = {}
    private_state: dict = {}
    # слот для игро-специфичных полей (watch-party: stream_token).
    # не валидируем здесь — будет жить в public_state как reserved key
    # см. tasks/tick-contract-typescript.md → StandardPublicDelta.
```

### Protocol

```python
# protocol.py
from typing import Protocol

class GameBackend(Protocol):
    """Что должен реализовать каждый game-бэкенд. Сигнатуры — ориентир
    для mypy и docs; runtime не enforce-ится (sdk не знает про FastAPI)."""

    async def on_health(self) -> HealthResponse: ...
    async def on_start(self, req: StartRequest) -> GameResponse: ...
    async def on_action(self, req: ActionRequest) -> GameResponse: ...
    async def on_view(self, req: ViewRequest) -> ViewResponse: ...
    async def on_tick(self, req: TickRequest) -> GameResponse: ...
    async def on_end(self, req: EndRequest) -> None: ...
```

## Обратная совместимость

- Все поля сверх обязательного минимума — опциональны с дефолтами.
- `GameResponse()` без аргументов валиден (эквивалент сегодняшнему poker-у,
  возвращающему `None` на `/tick`).
- `/end` не у всех бэкендов есть сегодня; протокол считает `on_end` обязательной,
  но в задачах по poker-у (`tasks/adopt-tick-contract.md`) прописано реализовать
  её как no-op.

## Acceptance criteria

- [ ] `python/pyproject.toml` и `python/mimigames_sdk/` созданы.
- [ ] `pip install 'mimigames-sdk @ git+https://…#subdirectory=python'` в
      чистом venv проходит.
- [ ] Импорты успешны:
      `from mimigames_sdk.protocol import GameBackend, StartRequest, ActionRequest, ViewRequest, TickRequest, EndRequest, GameResponse, ViewResponse, ScheduledBroadcast`
      `from mimigames_sdk.types import Player, HealthResponse`.
- [ ] `mypy` на учебном «dummy backend», который *не* имплементит `on_view`,
      выдаёт ошибку (Protocol работает статически).
- [ ] README содержит пример «как реализовать backend под этот протокол» и
      «как pin-ить версию».
- [ ] Tag `sdk-python-v0.1.0` на коммите мержа.

## Out of scope

- Публикация в PyPI.
- Автогенерация TS-типов (см. `tasks/tick-contract-typescript.md` —
  ручное зеркало).
- `create_game_router(impl: GameBackend)` FastAPI-фабрика
  (см. `tasks/server-router-factory.md` — отдельная волна).
- Client-side helper для core (см.
  `mimigames-org/mimigames:tasks/game-backend-client.md`).
