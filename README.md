# MimiSDK

Публичный JavaScript SDK для разработчиков игр на платформе MimiGames.

Подключи один файл — и твоя игра умеет получать состояние и отправлять ходы через платформу.

## Быстрый старт

```html
<!DOCTYPE html>
<html>
<body>
  <div id="board"></div>

  <script type="module">
    import MimiSDK from 'https://mimigames.io/sdk.js'

    // 1. Зарегистрируй колбэки ДО вызова ready()
    MimiSDK.onPlayerInfo((player) => {
      console.log('Я:', player.id, player.name, player.role)
      // role: 'player' или 'spectator'
    })

    MimiSDK.onStateUpdate(({ delta, snapshot }) => {
      if (snapshot) {
        // Первая загрузка / переподключение — полное состояние
        renderFull(snapshot)
      } else {
        // Обычное обновление в процессе игры — только изменения
        applyDelta(delta)
      }
    })

    MimiSDK.onGameEvent((event) => {
      if (event.type === 'phase_changed') {
        showPhase(event.payload.phase)
      }
      if (event.type === 'game_over') {
        showWinner(event.payload.winner)
      }
    })

    // 2. Сообщи платформе: iframe загружен
    // Если не вызвать в течение 10 секунд — платформа покажет ошибку загрузки
    MimiSDK.ready()

    // 3. Отправить ход
    document.getElementById('board').addEventListener('click', (e) => {
      MimiSDK.sendAction('move', { from: 'e2', to: 'e4' })
    })
  </script>
</body>
</html>
```

## API

### `MimiSDK.ready()`

Сообщает платформе, что iframe загружен и готов принимать данные. Вызывай после регистрации всех колбэков. Платформа ответит `player_info` и начальным `state_snapshot`.

**Важно:** если `ready()` не вызван в течение 10 секунд — платформа показывает ошибку с кнопкой retry.

---

### `MimiSDK.sendAction(action, payload?)`

Отправляет игровое действие на сервер.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `action` | `string` | Название действия: `'move'`, `'vote'`, `'pass'` и т.д. |
| `payload` | `object` | Данные действия. По умолчанию `{}` |

```js
MimiSDK.sendAction('vote', { target: 'vasya' })
```

---

### `MimiSDK.onStateUpdate(callback)`

Подписка на обновления состояния игры.

```js
MimiSDK.onStateUpdate(({ delta, snapshot }) => {
  // Ровно одно из них всегда null:
  // snapshot — полное состояние (первая загрузка / переподключение)
  // delta    — только изменившиеся поля
})
```

---

### `MimiSDK.onGameEvent(callback)`

Подписка на игровые события: смена фазы, выбывание игрока, конец игры.

```js
MimiSDK.onGameEvent((event) => {
  // event.type: 'phase_changed' | 'player_eliminated' | 'game_over'
  // event.payload: { ... }
})
```

---

### `MimiSDK.onPlayerInfo(callback)`

Получить информацию о текущем игроке. Вызывается один раз после `ready()`.

```js
MimiSDK.onPlayerInfo((player) => {
  // player.id:   string  — уникальный ID
  // player.name: string  — отображаемое имя
  // player.role: 'player' | 'spectator'
})
```

## Дизайн-токены

### `MimiSDK.theme`

Объект с дизайн-токенами платформы. Можно читать напрямую в JS:

```js
const { primary, bg, error } = MimiSDK.theme.colors
const { lg } = MimiSDK.theme.radius
const font = MimiSDK.theme.font
```

| Поле | Описание |
|------|----------|
| `colors.bg` | Фон платформы `#0f0f1a` |
| `colors.primary` | Акцентный цвет `#7c3aed` (violet) |
| `colors.primaryHover` | Hover-состояние primary `#6d28d9` |
| `colors.teal` | Интерактив/hover `#0d9488` |
| `colors.amber` | Highlight/me `#f59e0b` |
| `colors.error` | Ошибки `#ff5454` |
| `colors.surface` | Фон карточек `rgba(255,255,255,0.04)` |
| `colors.border` | Граница карточек `rgba(255,255,255,0.08)` |
| `colors.textPrimary` | Основной текст `#fff` |
| `colors.textSecondary` | Вторичный текст `rgba(255,255,255,0.6)` |
| `colors.textGhost` | Призрачный текст `rgba(255,255,255,0.3)` |
| `radius.sm / md / lg` | `4px` / `8px` / `12px` |
| `font` | `'Helvetica Neue', Helvetica, Arial, sans-serif` |

---

### `MimiSDK.injectTheme()`

Вставляет CSS-переменные платформы в `<head>` текущего документа (iframe). Метод идемпотентен — повторные вызовы не дублируют стили.

```js
MimiSDK.injectTheme()
```

После вызова в твоём CSS доступны переменные:

```css
body {
  background: var(--mimi-bg);          /* #0f0f1a */
  color: var(--mimi-text);             /* #fff */
  font-family: var(--mimi-font);
}

button {
  background: var(--mimi-primary);     /* #7c3aed */
  border-radius: var(--mimi-radius-md);/* 8px */
}

button:hover {
  background: var(--mimi-primary-hover);
}

.card {
  background: var(--mimi-surface);
  border: 1px solid var(--mimi-border);
  border-radius: var(--mimi-radius-lg);
}
```

Полный список переменных:

| Переменная | Значение |
|------------|----------|
| `--mimi-bg` | `#0f0f1a` |
| `--mimi-primary` | `#7c3aed` |
| `--mimi-primary-hover` | `#6d28d9` |
| `--mimi-teal` | `#0d9488` |
| `--mimi-amber` | `#f59e0b` |
| `--mimi-error` | `#ff5454` |
| `--mimi-surface` | `rgba(255,255,255,0.04)` |
| `--mimi-border` | `rgba(255,255,255,0.08)` |
| `--mimi-text` | `#fff` |
| `--mimi-text-secondary` | `rgba(255,255,255,0.6)` |
| `--mimi-text-ghost` | `rgba(255,255,255,0.3)` |
| `--mimi-radius-sm` | `4px` |
| `--mimi-radius-md` | `8px` |
| `--mimi-radius-lg` | `12px` |

---

## Регистрация игры

Зарегистрируй свою игру через API платформы:

```json
{
  "name": "Моя игра",
  "backend_url": "https://my-game.example.com",
  "frontend_url": "https://my-game.example.com/ui",
  "icon_url": "https://my-game.example.com/icon.png",
  "config_schema": {}
}
```

После регистрации платформа проверит `GET /health` твоего бэкенда. Игра появится в каталоге только если бэкенд доступен.

## Контракт бэкенда

Твой бэкенд должен реализовать HTTP API:

```
POST /start   {room_id, players: [{id, name}], config: {}}
POST /action  {room_id, player_id, action, payload}
POST /tick    {room_id}
GET  /health
GET  /state/{room_id}?player_id={player_id}
```

Канонические pydantic-модели и `typing.Protocol` живут в Python-подпакете
[`python/`](./python/) (`mimigames-sdk`). TypeScript-зеркало тех же моделей —
в [`sdk.d.ts`](./sdk.d.ts) (секция «Game-backend HTTP protocol»).

## Reserved `public_delta` / `public_state` keys

Платформа пишет и читает несколько namespaced-ключей в `public_delta`
ответов `/start` `/action` `/tick` и в `public_state` ответа `/view`.
Игры **не должны** использовать эти имена под свои данные — иначе платформа
перезатрёт их или прочитает чужое.

| Ключ | Тип | Где появляется | Кто пишет | Кто читает |
|------|-----|----------------|-----------|------------|
| `stream_token` | `string` | `public_delta`, `public_state` | backend (watch-party) | core + frontend-SDK |
| `phase` | `{ name: string, expires_at: number }` | `public_delta` | backend | frontend-SDK (таймер фазы) |
| `chat_notice` | `string` | `public_delta` | core | frontend-SDK (баннер) |

Полный список и TS-типы — `StandardPublicDelta` / `StandardPublicState`
в [`sdk.d.ts`](./sdk.d.ts). Добавляй сюда ключ, только если он нужен
минимум двум играм — иначе держи его в приватной схеме игры.
