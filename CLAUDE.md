# CLAUDE.md — mimigames-sdk

## Что это

Один JavaScript-файл (`sdk.js`) — публичный SDK для разработчиков игр на платформе MimiGames. Раздаётся через GitHub Pages.

**CDN URL:** `https://mimigames-org.github.io/sdk/sdk.js`  
**Канонический URL:** `https://mimigames.io/sdk.js` (Caddy проксирует на GitHub Pages)

## Как работает

SDK — IIFE-модуль. Общается с платформой через `window.postMessage()`:

```
iframe (игра)
    ↕ postMessage
Platform UI (core/iframe.js)
```

Входящие сообщения от платформы:
- `{type: "state_update", delta, snapshot}` — обновление состояния
- `{type: "game_event", event}` — игровое событие
- `{type: "player_info", player}` — информация об игроке

Исходящие сообщения в платформу:
- `{type: "ready"}` — iframe загружен, готов принимать стейт
- `{type: "action", action, payload}` — игровое действие

## Структура файла

```
sdk.js
  MimiSDK.onPlayerInfo(cb)    — подписка на player_info
  MimiSDK.onStateUpdate(cb)   — подписка на state_update
  MimiSDK.onGameEvent(cb)     — подписка на game_event
  MimiSDK.sendAction(action, payload)  — отправить ход
  MimiSDK.ready()             — сигнал готовности iframe
  MimiSDK.theme               — дизайн-токены платформы
  MimiSDK.injectTheme()       — вставить CSS custom properties в <head>
```

## Git Hooks

Проект использует кастомные githooks из `.githooks/`. **Обязательно** включи их перед началом работы:

```bash
git config core.hooksPath .githooks
```

### pre-commit
- `npm run lint` — eslint

### pre-push
- `npm test` — тесты в Node.js (без зависимостей)

**Все агенты обязаны включить githooks (`git config core.hooksPath .githooks`) при первом checkout.**

## CI

`.github/workflows/ci.yml`: lint (eslint) → test (node) при каждом PR и пуше в main.
`.github/workflows/pages.yml`: деплой sdk.js на GitHub Pages при пуше в main.

## Деплой

При пуше в `main` GitHub Actions автоматически деплоит на GitHub Pages (`.github/workflows/pages.yml`).  
Изменения появляются на CDN в течение нескольких минут.

## Изменение SDK

SDK не имеет версионирования — всегда один файл. Все игры подключают текущую версию.  
При breaking changes нужно уведомить разработчиков игр (changelog в README или GitHub Release).

## Дизайн-токены

Все цвета, радиусы и шрифты определены в `MimiSDK.theme`. Игры могут читать их напрямую или вызвать `MimiSDK.injectTheme()` для CSS custom properties (`--mimi-bg`, `--mimi-primary` и др.).
