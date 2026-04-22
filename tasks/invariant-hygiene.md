# Task: Гигиена инвариантов в SDK (JS)

## Overview

Аудит SDK по `meta/INVARIANTS.md` (2026-04-22). Python-часть
(`sdk/python/mimigames_sdk/`) — чисто: контракт #16 полностью
реализован, схемы явные. JS-часть (`sdk.js`) имеет несколько
minor-нарушений по #7 (магические строки event/action-типов) и
косметически по #5.

## Мотивация

Message-типы в `sdk.js` передаются между родительским окном и
игровым iframe через `postMessage`. Если опечатка в клиентской
игре (`'sate_update'` вместо `'state_update'`) — silent no-op,
отловить можно только UI-тестом. Экспорт констант решит проблему:
опечатка превратится в `ReferenceError` на этапе загрузки.

## Scope

### #7 — Константы типов сообщений

В `sdk.js` используются строковые литералы:

- `'state_update'` (`sdk.js:42`)
- `'game_event'` (`sdk.js:45`)
- `'player_info'` (`sdk.js:47`)
- `'ready'` (`sdk.js:127`)
- `'action'` (`sdk.js:136`)

Ввести:

```js
export const MIMI_MESSAGE_TYPES = Object.freeze({
  STATE_UPDATE: 'state_update',
  GAME_EVENT: 'game_event',
  PLAYER_INFO: 'player_info',
  READY: 'ready',
  ACTION: 'action',
});
```

Использовать внутри SDK и экспортировать для потребителей (игровых
iframe). Обновить `sdk.d.ts` — добавить typed union:

```ts
export type MimiMessageType =
  | 'state_update' | 'game_event' | 'player_info' | 'ready' | 'action';
```

Синхронизировать со списком в `sdk/python/mimigames_sdk/protocol.py`
(там уже Literal-типы, убедиться что наборы совпадают).

### #5 — Фолбэки в JS (minor)

- `sdk.js:40` — `const { type } = event.data || {};` — допустимо
  (защита от `null`), но прокомментировать почему fallback на пустой
  объект корректен.

### #21 — console.warn с интерполяцией (minor)

`sdk.js:27` — `console.warn('[MimiSDK] No targetOrigin configured,
using "*". Set targetOrigin for security.');` — это literal, не
f-строка, нарушения нет. Оставить как есть.

## Acceptance criteria

- `scripts/test.sh sdk` — зелёный (`npm test`).
- В `sdk.js` нет неэкспортированных литералов для message-типов.
- `sdk.d.ts` содержит `MimiMessageType` union.
- Набор типов синхронен с Python SDK (`protocol.py`).
- Игра может импортировать `MIMI_MESSAGE_TYPES` и использовать
  `if (msg.type === MIMI_MESSAGE_TYPES.STATE_UPDATE)`.

## Разбивка

Один коммит — задача мелкая.

## Не в scope

- Python SDK — инвариантам соответствует.
- Перевод JS на TypeScript — отдельная задача (есть history
  `tick-contract-typescript.md`, но он про Python-схемы).

## Links

- `meta/INVARIANTS.md` (#7)
- `sdk/python/mimigames_sdk/protocol.py` (источник правды для типов)
- `sdk/sdk.js`, `sdk/sdk.d.ts`
