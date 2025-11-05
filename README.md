# Fortuna Telegram Bot - TypeScript Edition 🏐

> Telegram бот для управления волейбольными играми команды Fortuna, полностью переписанный на TypeScript с профессиональной архитектурой

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## ✨ Особенности

- 🎯 **Полная типизация** - TypeScript для безопасности типов
- 🏗️ **Слоистая архитектура** - Clean Architecture: handlers → services → repositories
- 🔒 **Валидация** - Проверка всех входных данных
- 🎨 **Чистый код** - Следование принципам SOLID и DRY
- 🐳 **Docker** - Полная контейнеризация приложения
- 📝 **Документация** - JSDoc комментарии и подробные README
- 🌍 **Мультиязычность** - Поддержка русского и азербайджанского языков
- ⚡ **Производительность** - Оптимизированные запросы к БД

## 📁 Структура проекта

```
fortuna-telegram-bot-ts/
├── src/
│   ├── config/              # Конфигурация приложения
│   │   ├── database.ts      # Настройки БД
│   │   └── bot.ts           # Настройки бота
│   ├── types/               # TypeScript типы и интерфейсы
│   │   ├── common.types.ts
│   │   ├── user.types.ts
│   │   ├── game.types.ts
│   │   └── admin.types.ts
│   ├── constants/           # Константы приложения
│   │   ├── messages.ts
│   │   └── jokeTypes.ts
│   ├── utils/               # Утилиты
│   │   ├── declension.ts    # Склонение слов (RU/AZ)
│   │   ├── formatter.ts     # Форматирование сообщений
│   │   └── validator.ts     # Валидация данных
│   ├── database/            # Слой работы с БД
│   │   ├── connection.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── game.repository.ts
│   │       ├── gamePlayer.repository.ts
│   │       ├── adminGroup.repository.ts
│   │       └── joke.repository.ts
│   ├── services/            # Бизнес-логика
│   │   ├── user.service.ts
│   │   └── game.service.ts
│   ├── bot/                 # Telegram бот
│   │   └── handlers/
│   │       ├── command.handler.ts
│   │       ├── callback.handler.ts
│   │       └── event.handler.ts
│   └── index.ts             # Точка входа
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── init.sql                 # SQL схема БД
├── tsconfig.json
├── package.json
├── .env.example
├── README.md
└── SETUP.md                 # Детальная инструкция по установке
```

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd fortuna-telegram-bot-ts
npm install
```

### 2. Настройка

Создайте `.env` файл:

```bash
cp .env.example .env
```

Заполните переменные:
```env
TELEGRAM_TOKEN=your_bot_token
DATABASE_PASSWORD=your_password
CREATOR_IDS=123456789,987654321
```

### 3. Запуск

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Docker:**
```bash
docker-compose up -d
```

## 📋 Основные команды бота

### 👥 Пользовательские
- `/register` - Регистрация в системе
- `/menu` - Главное меню с кнопками
- `/showgames` - Показать активные игры
- `/list` - Список участников игр
- `/agilliol` - Случайный пользователь "Ağıllı ol"

### 🔐 Административные
- `/startgame ДД.ММ.ГГГГ/ЧЧ:ММ/ЧЧ:ММ/лимит/место/название` - Создать игру
- `/deactivegame` - Деактивировать игру
- `/tagregistered` - Тегнуть всех зарегистрированных
- `/showregistered` - Показать список зарегистрированных
- `/taggamers` - Тегнуть участников игр
- `/addguest название/Имя Фамилия` - Добавить гостя на игру
- `/changelimit название/лимит` - Изменить лимит игры
- `/getgroupid` - Получить ID группы

## 🏗️ Архитектура

### Слоистая структура

```
┌─────────────────────────────────────┐
│         Bot Handlers                │  ← Обработка команд/callback
├─────────────────────────────────────┤
│          Services                   │  ← Бизнес-логика
├─────────────────────────────────────┤
│        Repositories                 │  ← Работа с БД
├─────────────────────────────────────┤
│         Database                    │  ← PostgreSQL
└─────────────────────────────────────┘
```

### Принципы
- **Single Responsibility** - Каждый класс имеет одну ответственность
- **Dependency Injection** - Зависимости инъектируются через конструктор
- **Repository Pattern** - Абстракция работы с БД
- **Service Layer** - Бизнес-логика отделена от обработчиков

## 🗄️ База данных

### Таблицы

- `users` - Пользователи системы
- `group_users` - Связь пользователей с группами
- `games` - Волейбольные игры
- `game_users` - Участники игр
- `game_guests` - Гости на играх
- `admin_groups` - Админские группы
- `jokes` - Шутки бота

### Схема создается автоматически из `init.sql`

## 📊 Сравнение с оригиналом

| Критерий | Старая версия (JS) | Новая версия (TS) |
|----------|-------------------|-------------------|
| **Типизация** | ❌ Отсутствует | ✅ Полная TypeScript |
| **Архитектура** | ❌ Спагетти-код | ✅ Clean Architecture |
| **Валидация** | ❌ Частичная | ✅ Полная |
| **Обработка ошибок** | ❌ Базовая | ✅ Централизованная |
| **Разделение слоев** | ❌ Смешано | ✅ Handlers/Services/Repos |
| **Переиспользуемость** | ❌ Дублирование | ✅ DRY принцип |
| **Тестируемость** | ❌ Сложная | ✅ Легкая |
| **Документация** | ❌ Минимальная | ✅ Полная + JSDoc |
| **Масштабируемость** | ❌ Проблематична | ✅ Легкая |

## 🛠️ Технологии

- **TypeScript 5.7** - Типизированный JavaScript
- **Node.js 20** - Среда выполнения
- **node-telegram-bot-api** - Telegram Bot API
- **PostgreSQL 16** - Реляционная БД
- **Docker & Docker Compose** - Контейнеризация
- **tsx** - TypeScript execution для dev
- **Moment.js** - Работа с датами

## 📝 Разработка

```bash
# Разработка с hot-reload
npm run dev

# Линтинг
npm run lint

# Форматирование
npm run format

# Сборка
npm run build

# Production
npm start
```

## 🐳 Docker

### Локальная разработка
```bash
docker-compose up -d          # Запуск
docker-compose down           # Остановка
docker-compose logs -f bot    # Логи
docker-compose restart bot    # Перезапуск
```

### Production деплой
См. подробные инструкции:
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт (5 шагов)
- 📚 [DEPLOY.md](./DEPLOY.md) - Детальная инструкция по CI/CD

**GitHub Actions автоматически деплоит при push в master!**

## 🎯 Что улучшено

### 1. **Типобезопасность**
```typescript
// Было (JS)
function addUser(user) { ... }

// Стало (TS)
async addUser(dto: CreateUserDto): Promise<string> { ... }
```

### 2. **Слоистая архитектура**
```
Handler → Service → Repository → Database
```

### 3. **Валидация**
```typescript
validateGameFormat(text: string): boolean
parseGameCommand(text: string): CreateGameDto | null
```

### 4. **Централизованные константы**
```typescript
export const Messages = {
  REGISTRATION_SUCCESS: '✅ Успешная регистрация',
  // ...
}
```

### 5. **Утилиты**
- Склонение слов (русский/азербайджанский)
- Форматирование пользователей
- Валидация данных

## 📚 Дополнительная документация

- [SETUP.md](./SETUP.md) - Детальная инструкция по установке и настройке
- [init.sql](./init.sql) - SQL схема базы данных

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

ISC © Kamran Kazimi

## 👨‍💻 Автор

**Kamran Kazimi**
- GitHub: [@kamran134](https://github.com/kamran134)

---

Made with ❤️ for Fortuna Volleyball Team 🏐
