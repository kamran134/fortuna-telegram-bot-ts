# Установка и запуск Fortuna Telegram Bot (TypeScript)

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните необходимые переменные в `.env`:
- `TELEGRAM_TOKEN` - токен вашего бота от @BotFather
- `DATABASE_PASSWORD` - пароль для PostgreSQL
- `CREATOR_IDS` - ID создателей бота (через запятую)

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Сборка для production

```bash
npm run build
npm start
```

## Docker

### Запуск с Docker Compose

```bash
docker-compose up -d
```

### Остановка

```bash
docker-compose down
```

### Просмотр логов

```bash
docker-compose logs -f bot
```

## Основные команды бота

### Пользовательские команды
- `/register` - Регистрация в системе
- `/menu` - Главное меню
- `/showgames` - Показать активные игры
- `/list` - Список участников игр

### Админские команды
- `/startgame ДД.ММ.ГГГГ/ЧЧ:ММ/ЧЧ:ММ/лимит/место/название` - Создать игру
- `/deactivegame` - Деактивировать игру
- `/tagregistered` - Тегнуть всех зарегистрированных
- `/showregistered` - Показать зарегистрированных
- `/taggamers` - Тегнуть участников игр
- `/addguest название_игры/Имя Фамилия` - Добавить гостя
- `/getgroupid` - Получить ID группы

## Структура проекта

```
src/
├── config/              # Конфигурация
│   ├── database.ts
│   └── bot.ts
├── types/               # TypeScript типы
│   ├── common.types.ts
│   ├── user.types.ts
│   ├── game.types.ts
│   └── admin.types.ts
├── constants/           # Константы
│   ├── messages.ts
│   └── jokeTypes.ts
├── utils/               # Утилиты
│   ├── declension.ts
│   ├── formatter.ts
│   └── validator.ts
├── database/            # Слой БД
│   ├── connection.ts
│   └── repositories/
│       ├── user.repository.ts
│       ├── game.repository.ts
│       ├── gamePlayer.repository.ts
│       ├── adminGroup.repository.ts
│       └── joke.repository.ts
├── services/            # Бизнес-логика
│   ├── user.service.ts
│   └── game.service.ts
├── bot/                 # Telegram бот
│   └── handlers/
│       ├── command.handler.ts
│       ├── callback.handler.ts
│       └── event.handler.ts
└── index.ts             # Точка входа
```

## Преимущества новой архитектуры

✅ **Типизация** - Полная типобезопасность с TypeScript
✅ **Слоистая архитектура** - Разделение ответственности (handlers → services → repositories)
✅ **Валидация** - Проверка входных данных
✅ **Переиспользуемость** - DRY принцип
✅ **Тестируемость** - Легко покрыть тестами
✅ **Масштабируемость** - Легко добавлять новый функционал
✅ **Читаемость** - Понятная структура кода

## База данных

PostgreSQL схема автоматически создается при первом запуске через `init.sql`.

Таблицы:
- `users` - Пользователи
- `group_users` - Связь пользователей с группами
- `games` - Игры
- `game_users` - Участники игр
- `game_guests` - Гости на играх
- `admin_groups` - Админские группы
- `jokes` - Шутки бота

## Разработка

### Линтинг

```bash
npm run lint
```

### Форматирование

```bash
npm run format
```

## Технологии

- **TypeScript** - Типизированный JavaScript
- **Node.js** - Среда выполнения
- **node-telegram-bot-api** - Telegram Bot API
- **PostgreSQL** - База данных
- **Docker** - Контейнеризация
- **tsx** - TypeScript выполнение для разработки

## Сравнение со старой версией

| Аспект | Старая версия (JS) | Новая версия (TS) |
|--------|-------------------|-------------------|
| Типизация | ❌ Нет | ✅ Полная |
| Архитектура | ❌ Смешанная | ✅ Слоистая |
| Валидация | ❌ Частичная | ✅ Полная |
| Обработка ошибок | ❌ Базовая | ✅ Улучшенная |
| Документация | ❌ Минимальная | ✅ JSDoc + README |
| Тестируемость | ❌ Сложная | ✅ Простая |

## Поддержка

При возникновении проблем проверьте:
1. Правильность токена бота в `.env`
2. Доступность базы данных
3. Логи: `docker-compose logs -f`

---

Сделано с ❤️ для команды Fortuna Volleyball
