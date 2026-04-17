# Task: `create_game_router(backend: GameBackend)` FastAPI factory  *(future wave)*

**Umbrella**: `mimigames-org/meta` — «Generalize tick interface»
**Branch**: `claude/generalize-tick-interface-5fK55`
**Depends on**: `tasks/tick-contract-python.md`

## Когда делаем

После того как L1+L2+L4 из umbrella-анализа завершатся (модели, Protocol,
core-side клиент, миграции бэкендов на модели). Эта задача — **отдельная
волна**, не блокер ни для чего выше.

## Context

После адаптации контракта в бэкендах (`watch-party`, `poker`) в каждом из
них остаётся FastAPI-обвязка:

```python
@router.post("/start", response_model=GameResponse)
async def start(req: StartRequest, request: Request): ...

@router.post("/action", response_model=GameResponse)
async def action(req: ActionRequest, request: Request): ...

# ... и так ещё 4 ручки
```

Плюс:

- Проверка заголовка `X-Mimi-Secret` в middleware/зависимости — копипаста.
- Структурированное логирование с `room_id`/`player_id` — копипаста.
- Маппинг исключений → HTTP-кодов — копипаста.
- Метрики на handler-side (если нужны) — копипаста.

Эта копипаста растёт линейно от числа бэкендов. Сегодня их 2 — терпимо;
при добавлении третьего (или если poker разделится на несколько игр,
как минимум holdem/omaha) становится реальной болью.

## Scope

Предоставить серверную фабрику в sdk, которая берёт объект, реализующий
`GameBackend` protocol, и возвращает готовый `APIRouter` с:

- Правильно смонтированными 6 endpoint-ами.
- Auth-middleware на `X-Mimi-Secret`.
- Error-mapping: `GameBackendError` → 400/500 с structured body.
- Логирование start/end каждого обращения с контекстом.
- Опциональные Prometheus-метрики (histogram duration, counter by outcome),
  если переданы соответствующие collectors.

### Предлагаемый API

```python
# python/mimigames_sdk/server.py
from fastapi import APIRouter, Header, HTTPException
from .protocol import GameBackend, StartRequest, ...

def create_game_router(
    backend: GameBackend,
    *,
    secret: str,
    game_name: str | None = None,
    metrics: ServerMetrics | None = None,
) -> APIRouter:
    router = APIRouter()

    def verify_secret(x_mimi_secret: str = Header(...)):
        if x_mimi_secret != secret:
            raise HTTPException(401, "bad secret")

    @router.get("/health", response_model=HealthResponse)
    async def _health():
        return await backend.on_health()

    @router.post("/start", response_model=GameResponse,
                 dependencies=[Depends(verify_secret)])
    async def _start(req: StartRequest):
        return await backend.on_start(req)

    # ... аналогично для action / view / tick / end

    return router
```

### Использование в бэкенде

```python
# watch-party/app.py
from mimigames_sdk.server import create_game_router

class WatchPartyBackend:
    async def on_health(self): ...
    async def on_start(self, req): ...
    async def on_action(self, req): ...
    async def on_view(self, req): ...
    async def on_tick(self, req): ...
    async def on_end(self, req): ...

app = FastAPI()
app.include_router(create_game_router(WatchPartyBackend(), secret=settings.mimi_secret))
```

Вся FastAPI-обвязка исчезает; бэкенд — чистая реализация protocol-а.

### Опциональные хуки

- `lifespan`-хуки в protocol-е: `on_startup()` / `on_shutdown()` — если
  хочется, можно добавить (но watch-party поднимает TorrentManager сам
  в `@app.on_event("startup")` — пусть продолжает, sdk не лезет).
- `game_name` для меток метрик (если не задан — без метрик).

## Acceptance criteria

- [ ] `mimigames_sdk.server.create_game_router` экспортируется.
- [ ] Unit-тесты через `TestClient(create_game_router(DummyBackend()))`:
      все 6 endpoint-ов отвечают правильным статусом и схемой,
      неверный `X-Mimi-Secret` → 401.
- [ ] При переданных `ServerMetrics` (protocol) — метрики инкрементятся.
- [ ] README-пример на 15 строк, показывающий «как написать backend под
      этот router».
- [ ] FastAPI как зависимость sdk — опциональная (extras_require):
      `pip install 'mimigames-sdk[server]'`. Core и тесты модели
      не должны тащить FastAPI.

## Migration (follow-up issues)

После мержа этой задачи — отдельные issues в `watch-party` и `poker`:

- `mimigames-org/watch-party` — «Migrate to `create_game_router`».
- `mimigames-org/poker` — «Migrate to `create_game_router`».

Оба — инвазивный рефакторинг routing-слоя, но предметно маленький
(обёртывание существующих функций в методы класса).

## Risks / open questions

- **FastAPI lock-in**: sdk начинает знать про FastAPI. Если когда-либо
  понадобится Litestar / aiohttp — придётся писать параллельную фабрику.
  На сегодня все бэкенды — FastAPI, принимаем lock-in.
- **Тестируемость backend-класса**: unit-тесты должны мочь тестировать
  методы напрямую без FastAPI (`await backend.on_tick(req)`). Это
  свойство Protocol-а, нужно только явно задокументировать.
- **Скрытая асинхронность ошибок**: исключение внутри `backend.on_*`
  должно превращаться в осмысленный HTTP-статус, а не 500 Internal. В
  v1 — 400 на `ValueError`, 500 на всё остальное. Документировать.
