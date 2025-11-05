# 🚀 Настройка на сервере (root@fortune-telegram-bot)

## Шаг 1: Обновить docker-compose.yml

```bash
ssh root@YOUR_SERVER_IP
cd /root/fortune-telegram-bot
nano docker-compose.yml
```

**Найдите строку с `image:`:**
```yaml
# Было (старый проект):
image: ghcr.io/kamran134/fortuna-telegram-bot:latest

# Стало (новый TypeScript проект):
image: ghcr.io/kamran134/fortuna-telegram-bot-ts:latest
```

**Полный обновленный docker-compose.yml:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: fortuna
      POSTGRES_USER: postgres
    volumes:
      - ~/pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"

  web:
    image: ghcr.io/kamran134/fortuna-telegram-bot-ts:latest
    restart: always
    ports:
      - "8443:8443"
    depends_on:
      - db
      - redis
    environment:
      TELEGRAM_TOKEN: ${TELEGRAM_TOKEN}
      DATABASE_USER: postgres
      DATABASE_HOST: db
      DATABASE_NAME: fortuna
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_PORT: 5432
      REDIS_HOST: redis
      REDIS_PORT: 6379
      CREATOR_IDS: ${CREATOR_IDS}
      NODE_ENV: production
```

Сохраните: `Ctrl+X`, `Y`, `Enter`

## Шаг 2: Создать/обновить .env файл

```bash
cat > /root/fortune-telegram-bot/.env << 'EOF'
TELEGRAM_TOKEN=your_actual_token_here
DATABASE_PASSWORD=plk_S2%92
CREATOR_IDS=963292126,112254199
EOF
```

**Замените `your_actual_token_here` на реальный токен!**

## Шаг 3: Инициализировать БД (только если первый запуск)

### Если БД уже была инициализирована - пропустите этот шаг!

```bash
cd /root/fortune-telegram-bot

# Запустить только БД
docker-compose up -d db

# Подождать 10 секунд
sleep 10

# Скопировать init.sql с локального компьютера
# (На ВАШЕМ компьютере выполните в PowerShell:)
scp d:\pet\fortuna-telegram-bot-ts\init.sql root@YOUR_SERVER_IP:/root/fortune-telegram-bot/

# Вернуться на сервер и применить схему
docker exec -i $(docker ps -qf "name=db") psql -U postgres -d fortuna < init.sql

# Проверить что таблицы созданы
docker exec -it $(docker ps -qf "name=db") psql -U postgres -d fortuna -c "\dt"
```

Должны увидеть список таблиц: `users`, `games`, `game_users`, и т.д.

## Шаг 4: Настроить доступ к GitHub Container Registry

Если ваш репозиторий приватный:

```bash
# Создайте Personal Access Token на GitHub:
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Права: read:packages

# Залогиньтесь в ghcr.io
docker login ghcr.io -u kamran134 -p YOUR_GITHUB_TOKEN
```

## Шаг 5: Проверить что всё готово

```bash
# Проверить .env файл
cat /root/fortune-telegram-bot/.env

# Проверить docker-compose.yml (должно быть новое имя образа)
grep "image:" /root/fortune-telegram-bot/docker-compose.yml

# Проверить что БД работает
docker ps | grep postgres

# Проверить таблицы в БД (если уже инициализировали)
docker exec -it $(docker ps -qf "name=db") psql -U postgres -d fortuna -c "\dt"
```

## ✅ Чеклист готовности сервера

- [ ] `docker-compose.yml` обновлен (новое имя образа с `-ts`)
- [ ] `.env` файл создан с правильным токеном
- [ ] БД инициализирована (init.sql применен) *или уже была*
- [ ] Docker может pull образы из ghcr.io (залогинен если приватный)
- [ ] Порты 5432, 6379, 8443 свободны

## 🚀 Готово!

Теперь можете запустить деплой с локального компьютера:

```bash
git push origin master
```

GitHub Actions автоматически:
1. Соберет новый Docker образ
2. Загрузит его в ghcr.io
3. Подключится к серверу
4. Скачает новый образ
5. Перезапустит контейнеры

## 📊 Проверка после деплоя

```bash
ssh root@YOUR_SERVER_IP
cd /root/fortune-telegram-bot

# Статус контейнеров
docker-compose ps

# Логи бота (должно быть: ✅ Bot started successfully!)
docker-compose logs -f web

# Если что-то не так - перезапустить
docker-compose restart web
```

## 🆘 Troubleshooting

### Проблема: Cannot pull image
```bash
# Решение: Залогиньтесь в ghcr.io
docker login ghcr.io -u kamran134
```

### Проблема: БД не подключается
```bash
# Проверьте что БД запущена
docker-compose ps db
docker-compose logs db

# Перезапустите БД
docker-compose restart db
```

### Проблема: 404 Not Found from Telegram
```bash
# Проверьте токен в .env
cat .env

# Проверьте что переменная передается в контейнер
docker-compose config | grep TELEGRAM_TOKEN
```

---

**После настройки сервера вернитесь к инструкции по настройке GitHub Secrets!**
