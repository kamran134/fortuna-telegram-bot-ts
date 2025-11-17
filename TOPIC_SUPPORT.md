# Поддержка топиков Telegram

## Что сделано

Добавлена поддержка топиков (форумов) Telegram в бота.

## Как работает

### 1. Создание игры (`/startgame`)
- **Всегда публикуется в топик с ID = 1** (настроено в `src/config/bot.ts` как `GAMES_TOPIC_ID`)
- Это гарантирует, что все объявления об играх будут в одном месте

### 2. Все остальные команды
- **Отвечают в тот же топик**, откуда была вызвана команда
- Используют `message_thread_id` из исходного сообщения
- Команды: `/list`, `/showgames`, `/agilliol`, `/taggamers`, `/tagundecided`, `/register`, `/menu` и т.д.

## Изменённые файлы

1. **`src/config/bot.ts`**
   - Добавлена константа `GAMES_TOPIC_ID = 1`

2. **`src/bot/handlers/command.handler.ts`**
   - Обновлён метод `handleMessage()` для получения `message_thread_id`
   - Все handler-методы теперь принимают опциональный параметр `messageThreadId`
   - Передают `message_thread_id` в опциях при вызове `bot.sendMessage()`

3. **`src/bot/handlers/event.handler.ts`**
   - Приветствия и прощания публикуются в том же топике

4. **`src/services/game.service.ts`**
   - Все методы обновлены для поддержки `messageThreadId`
   - `createGame()` использует `GAMES_TOPIC_ID` для публикации объявлений

## Структура топиков

Можно получить ID топика из URL:
- Формат: `https://t.me/c/{CHAT_ID}/{TOPIC_ID}`
- Пример: `https://t.me/c/1406297678/1` → топик с ID = 1

## Настройка

Если нужно изменить топик для объявлений игр, отредактируй константу в `src/config/bot.ts`:

```typescript
export const GAMES_TOPIC_ID = 1; // Измени на нужный ID
```
