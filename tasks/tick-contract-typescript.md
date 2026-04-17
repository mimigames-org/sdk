# Task: Mirror the full game-backend protocol in TypeScript

**Umbrella**: `mimigames-org/meta` — «Generalize tick interface»
**Branch**: `claude/generalize-tick-interface-5fK55`
**Depends on**: `tasks/tick-contract-python.md` (форма моделей)

## Scope note

Расширено с «только tick» до зеркала всего protocol-а в `sdk.d.ts` — те же
модели, что и в Python-подпакете, чтобы frontend-SDK и игры-клиенты могли
консистентно типизировать сообщения, приходящие через postMessage-бридж.

## Scope

1. Зеркальные TS-интерфейсы в `sdk.d.ts` для всех Request/Response.
2. `StandardPublicDelta` / `StandardPublicState` — перечень namespaced ключей,
   зарезервированных платформой, чтобы игры не коллидили по именам
   (`stream_token`, `phase`, `chat_notice` и т.д.).
3. Раздел в `README.md` — «Reserved keys» с таблицей: ключ, тип, кто пишет,
   кто читает.

### sdk.d.ts

```ts
export interface Player {
  id: string;
  name: string;
}

// Requests (core → backend)
export interface StartRequest {
  room_id: string;
  players: Player[];
  config?: Record<string, unknown>;
}

export interface ActionRequest {
  room_id: string;
  player_id: string;
  action: string;
  payload?: Record<string, unknown>;
  state?: Record<string, unknown> | null;
}

export interface ViewRequest {
  room_id: string;
  player_id: string;
  state?: Record<string, unknown> | null;
}

export interface TickRequest {
  room_id: string;
  now: number;
  tick_index: number;
  room_age_s: number;
  elapsed_s: number;
}

export interface EndRequest {
  room_id: string;
}

// Events
export type GameEvent =
  | { type: "game_over"; winner_id?: string | null }
  | { type: "player_eliminated"; player_id: string }
  | { type: "phase_changed"; phase: string };

export interface ScheduledBroadcast {
  delay_s: number;
  public_delta?: Record<string, unknown>;
  private_deltas?: Record<string, Record<string, unknown>>;
}

// Responses
export interface GameResponse {
  state?: Record<string, unknown> | null;
  public_delta?: StandardPublicDelta & Record<string, unknown>;
  private_deltas?: Record<string, Record<string, unknown>>;
  events?: GameEvent[];
  // tick-only:
  next_tick_in?: number | null;
  scheduled_broadcasts?: ScheduledBroadcast[] | null;
}

export interface ViewResponse {
  public_state?: StandardPublicState & Record<string, unknown>;
  private_state?: Record<string, unknown>;
}

// Reserved keys
export interface StandardPublicDelta {
  stream_token?: string;
  phase?: { name: string; expires_at: number };
  chat_notice?: string;
  // добавлять по мере появления кросс-игровых потребностей.
}

export interface StandardPublicState {
  stream_token?: string;
  // watch-party вкладывает токен сюда при /view-ответе (сегодня это
  // уже так работает, только не было задокументировано).
}
```

### Runtime

`sdk.js` — без изменений. Только комментарий-ссылка на типы.

## Acceptance criteria

- [ ] `sdk.d.ts` включает `Player`, `StartRequest`, `ActionRequest`,
      `ViewRequest`, `TickRequest`, `EndRequest`, `GameEvent`,
      `ScheduledBroadcast`, `GameResponse`, `ViewResponse`,
      `StandardPublicDelta`, `StandardPublicState`.
- [ ] Имена и nullability полей совпадают 1:1 с Python-моделями
      из `python/mimigames_sdk/protocol.py` (сверить визуально или тестом).
- [ ] В README есть раздел «Reserved `public_delta` / `public_state` keys».
- [ ] `tsc --noEmit` на `sdk.d.ts` проходит без ошибок.

## Follow-ups (не в этой задаче)

- Миграция `public_delta.stream_token` как reserved key в watch-party —
  технически он уже так называется, этой задачей только документируем.
- Генератор TS из Python-моделей, если ручное зеркало начнёт расходиться.
