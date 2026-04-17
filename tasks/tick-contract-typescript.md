# Task: Mirror tick contract in `sdk.d.ts` + standard `public_delta` schema

**Umbrella**: `mimigames-org/meta` — «Generalize tick interface»
**Branch**: `claude/generalize-tick-interface-5fK55`
**Depends on**: `tasks/tick-contract-python.md` (форма модели должна быть зафиксирована)

## Context

`sdk.js` / `sdk.d.ts` — фасад между frontend-игрой в iframe и платформой. После
того как мы формализуем серверный tick-контракт в Python (`tasks/tick-contract-python.md`),
фронтенду полезно знать те же самые формы — особенно содержимое `public_delta`,
которое приезжает через postMessage-бридж после каждого тика.

Сегодня `public_delta` — это словарь с произвольными ключами («current_position»,
«playing», «stream_token», …), и у SDK нет способа подсказать игре, что именно
она может получить. Любая игра должна читать документацию чужих игр, чтобы
избежать коллизий имён.

## Scope

1. Зеркальные TypeScript-интерфейсы для всех моделей из
   `python/mimigames_sdk/tick.py` — добавить в `sdk.d.ts`.
2. Ввести namespaced `StandardPublicDelta` — перечень зарезервированных core-ом
   ключей. Игры не должны их переопределять.

### Изменения

- `sdk.d.ts` — добавить:

```ts
export interface TickRequest {
  room_id: string;
  now: number;
  tick_index: number;
  room_age_s: number;
  elapsed_s: number;
}

export type TickEvent =
  | { type: "game_over"; winner_id?: string | null }
  | { type: "player_eliminated"; player_id: string }
  | { type: "phase_changed"; phase: string };

export interface ScheduledBroadcast {
  delay_s: number;
  public_delta?: Record<string, unknown>;
  private_deltas?: Record<string, Record<string, unknown>>;
}

export interface TickResponse {
  state?: Record<string, unknown> | null;
  public_delta?: StandardPublicDelta & Record<string, unknown>;
  private_deltas?: Record<string, Record<string, unknown>>;
  events?: TickEvent[];
  next_tick_in?: number | null;
  scheduled_broadcasts?: ScheduledBroadcast[] | null;
}

/** Ключи, зарезервированные платформой. Игры не должны переопределять. */
export interface StandardPublicDelta {
  stream_token?: string;
  phase?: { name: string; expires_at: number };
  chat_notice?: string;
  // добавлять по мере появления кросс-игровых потребностей.
}
```

- `sdk.js` — никаких изменений рантайма; только комментарий-ссылка на типы.
- Раздел в `README.md` — «Reserved keys» с таблицей: ключ, тип, кто пишет,
  кто читает.

## Acceptance criteria

- [ ] `sdk.d.ts` включает `TickRequest`, `TickResponse`, `TickEvent`,
      `ScheduledBroadcast`, `StandardPublicDelta`.
- [ ] Имена и nullability полей совпадают с Python-моделями 1:1 (сверить
      визуально или тестом).
- [ ] В README есть раздел «Reserved `public_delta` keys».
- [ ] `tsc --noEmit` на `sdk.d.ts` проходит без ошибок (если есть настройка
      сборки — добавить в CI).

## Follow-ups (не в этой задаче)

- Миграция watch-party на `public_delta.stream_token` как reserved key —
  он уже так и называется, просто теперь документирован.
- Генератор TS из Python-моделей, если ручное зеркалирование начнёт расходиться.
