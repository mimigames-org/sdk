# Task: Add Python subpackage with canonical tick contract

**Umbrella**: `mimigames-org/meta` — «Generalize tick interface»
**Branch**: `claude/generalize-tick-interface-5fK55`
**Depends on**: none (foundation)

## Context

Сегодня контракт `POST /tick` между `mimigames-org/mimigames:core/ticker.py`
и игровыми бэкендами (`watch-party`, `poker`, …) полностью неформален:

- каждый бэкенд переопределяет свой локальный `TickRequest(BaseModel)` c
  единственным полем `room_id`;
- ответ возвращается как нетипизированный dict (`{state, public_delta,
  private_deltas, events}` в watch-party) или `None` в poker;
- `core/ticker.py::_process_game_response` работает с `Optional[dict]` и
  любыми отклонениями.

Это репо — естественный дом для канонического описания контракта: `sdk.js` /
`sdk.d.ts` уже живут здесь как источник правды для фронтенд-интеграции; серверную
часть логично положить рядом.

## Scope

Создать Python-подпакет внутри `mimigames-org/sdk` с pydantic-моделями
`TickRequest`/`TickResponse`, который импортируют `core` и игровые бэкенды.

### Изменения

- Новая директория `python/` на уровне корня репо.
- `python/pyproject.toml` — пакет `mimigames_sdk` (версия `0.1.0`), зависимости:
  `pydantic>=2`. Сборка — hatchling или аналог.
- `python/mimigames_sdk/__init__.py` — реэкспорт моделей из `.tick`.
- `python/mimigames_sdk/tick.py` с моделями:

```python
from typing import Literal, Annotated
from pydantic import BaseModel, Field

class TickRequest(BaseModel):
    room_id: str
    now: float = 0.0            # server unix time, seconds
    tick_index: int = 0         # monotonically increasing per room
    room_age_s: float = 0.0     # seconds since room entered in_game
    elapsed_s: float = 0.0      # seconds since last tick for this room

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

class TickResponse(BaseModel):
    state: dict | None = None
    public_delta: dict = {}
    private_deltas: dict[str, dict] = {}
    events: list[TickEvent] = []
    next_tick_in: float | None = None
    scheduled_broadcasts: list[ScheduledBroadcast] | None = None
```

- `python/README.md` — пример импорта и установки как git-dep.
- Тег `sdk-python-v0.1.0` после мержа — чтобы игры закрепляли версию через
  `mimigames-sdk @ git+https://github.com/mimigames-org/sdk.git@sdk-python-v0.1.0#subdirectory=python`.

## Acceptance criteria

- [ ] `python/pyproject.toml` и `python/mimigames_sdk/` созданы на `main`.
- [ ] `pip install 'mimigames-sdk @ git+https://…#subdirectory=python'`
      в чистом venv проходит.
- [ ] `from mimigames_sdk.tick import TickRequest, TickResponse,
      ScheduledBroadcast` — импорт успешен.
- [ ] Все новые поля в `TickRequest` сверх `room_id` имеют дефолты →
      старые бэкенды (которые не читают новые поля) совместимы без изменений.
- [ ] Все поля в `TickResponse` имеют дефолты → `TickResponse()` валиден
      как «пустой» ответ (эквивалент сегодняшнему `None` у poker).
- [ ] Тэг `sdk-python-v0.1.0` проставлен на коммите мержа.

## Out of scope

- Публикация в PyPI.
- Генерация TypeScript-типов из Python (см. задачу `tick-contract-typescript.md`
  в этом же репо — зеркальная, ручная).
