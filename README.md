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

Подробнее — в основной документации платформы.
