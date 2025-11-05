# 📋 Шпаргалка по деплою - Заполните данные

## 🔐 GitHub Secrets (Settings → Secrets → Actions)

| Secret Name | Ваше значение | Описание |
|-------------|---------------|----------|
| `SERVER_HOST` | `ваш_IP_адрес` | IP адрес или домен сервера |
| `SERVER_USER` | `root` | SSH пользователь |
| `SERVER_PORT` | `22` | SSH порт |
| `SERVER_PATH` | `/root/fortune-telegram-bot` | Путь к папке с docker-compose.yml |
| `SSH_PRIVATE_KEY` | См. ниже ↓ | Приватный SSH ключ |
| `TELEGRAM_TOKEN` | _________________ | Токен Telegram бота |
| `DATABASE_PASSWORD` | `plk_S2%92` | Пароль PostgreSQL |

## 🔑 Как получить SSH_PRIVATE_KEY

```bash
# 1. Создайте ключ (если еще нет)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/fortuna_deploy

# 2. Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/fortuna_deploy.pub USER@SERVER_IP

# 3. Скопируйте приватный ключ (ВЕСЬ ТЕКСТ)
cat ~/.ssh/fortuna_deploy

# 4. Вставьте в GitHub Secret (включая BEGIN и END строки)
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

## 📝 На сервере нужно:

### 1. Обновить docker-compose.yml
```bash
ssh USER@SERVER
cd ~/fortune-telegram-bot
nano docker-compose.yml
# Вставьте содержимое из docker-compose.prod.yml
```

**ВАЖНО:** Измените имя образа:
```yaml
# Было:
image: ghcr.io/kamran134/fortuna-telegram-bot:latest

# Стало:
image: ghcr.io/kamran134/fortuna-telegram-bot-ts:latest
```

### 2. Создать .env файл
```bash
cat > .env << 'EOF'
TELEGRAM_TOKEN=ваш_токен_сюда
DATABASE_PASSWORD=plk_S2%92
CREATOR_IDS=963292126,112254199
EOF
```

### 3. Инициализировать БД (если первый раз)
```bash
# Запустить только БД
docker-compose up -d db

# Скопировать init.sql с локального компьютера
# (на локальном компьютере выполните:)
scp d:\pet\fortuna-telegram-bot-ts\init.sql USER@SERVER:~/fortune-telegram-bot/

# На сервере применить схему
docker exec -i fortuna-bot-db psql -U postgres -d fortuna < init.sql

# Проверить
docker exec -it fortuna-bot-db psql -U postgres -d fortuna -c "\dt"
```

## ✅ Чеклист перед деплоем

- [ ] Все 7 secrets добавлены в GitHub
- [ ] SSH ключ работает: `ssh -i ~/.ssh/fortuna_deploy USER@SERVER`
- [ ] docker-compose.yml обновлен на сервере (новое имя образа!)
- [ ] .env файл создан на сервере
- [ ] БД инициализирована (init.sql применен)
- [ ] Workflow файлы закоммичены в репозиторий

## 🚀 Запуск деплоя

```bash
cd d:\pet\fortuna-telegram-bot-ts
git add .
git commit -m "Setup CI/CD"
git push origin master
```

Следите за процессом: **GitHub → Actions**

## 🔍 Проверка после деплоя

```bash
# На сервере
ssh USER@SERVER
cd ~/fortune-telegram-bot

# Статус контейнеров
docker-compose ps

# Логи бота (должно быть: ✅ Bot started successfully!)
docker-compose logs -f web

# Все логи
docker-compose logs -f
```

## 🔄 Обычная работа

После настройки:
1. Пушите код в master: `git push`
2. GitHub Actions автоматически задеплоит
3. Проверяете логи на сервере

## 🆘 Если что-то не работает

### Ошибка при деплое
```bash
# Проверьте логи GitHub Actions
GitHub → Repository → Actions → Последний workflow → Logs

# Проверьте логи на сервере
docker-compose logs --tail=100 web
```

### Бот не стартует
```bash
# Проверьте переменные окружения
docker-compose config

# Проверьте токен
echo $TELEGRAM_TOKEN

# Перезапустите
docker-compose restart web
```

### Не может подключиться к БД
```bash
# Проверьте статус БД
docker-compose ps db
docker-compose logs db

# Проверьте подключение
docker exec -it fortuna-bot-db psql -U postgres -d fortuna -c "SELECT 1"
```

## 📞 Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Остановить всё
docker-compose down

# Пересоздать контейнер бота
docker-compose up -d --force-recreate web

# Очистить старые образы
docker image prune -a -f

# Логи с таймштампами
docker-compose logs -f -t web

# Зайти в контейнер
docker exec -it fortuna-bot sh
```

---

**После заполнения этого файла вы готовы к деплою! 🚀**
