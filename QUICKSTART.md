# 🚀 Быстрая инструкция по деплою

## 📝 Что вам нужно подготовить:

### 1. Информация о сервере
```
IP адрес/домен: _________________
SSH пользователь: _________________
SSH порт: _________ (обычно 22)
Путь к проекту: _________________ (например: /root/fortune-telegram-bot)
```

### 2. Данные для секретов
```
TELEGRAM_TOKEN: _________________________________
DATABASE_PASSWORD: plk_S2%92
CREATOR_IDS: 963292126,112254199
```

## ⚡ Быстрый старт (5 шагов)

### Шаг 1: Создайте SSH ключ

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/fortuna_deploy
ssh-copy-id -i ~/.ssh/fortuna_deploy.pub user@your-server-ip
```

### Шаг 2: Добавьте Secrets в GitHub

Идите: **Settings → Secrets and variables → Actions → New repository secret**

Добавьте 7 секретов:
1. `SERVER_HOST` = ваш IP или домен
2. `SERVER_USER` = ваш SSH пользователь
3. `SERVER_PORT` = 22
4. `SERVER_PATH` = путь к папке с docker-compose
5. `SSH_PRIVATE_KEY` = содержимое `~/.ssh/fortuna_deploy`
6. `TELEGRAM_TOKEN` = токен бота
7. `DATABASE_PASSWORD` = пароль БД

### Шаг 3: Обновите файлы на сервере

```bash
# Подключитесь к серверу
ssh user@your-server

# Перейдите в папку проекта
cd ~/fortune-telegram-bot

# Создайте .env файл
cat > .env << EOF
TELEGRAM_TOKEN=ваш_токен
DATABASE_PASSWORD=plk_S2%92
CREATOR_IDS=963292126,112254199
EOF

# Замените docker-compose.yml
nano docker-compose.yml
# Вставьте содержимое из docker-compose.prod.yml
# Или скопируйте файл с локального компьютера
```

### Шаг 4: Инициализируйте БД (если первый запуск)

```bash
# Запустите только БД
docker-compose up -d db

# Скопируйте init.sql на сервер (если еще нет)
scp init.sql user@server:~/fortune-telegram-bot/

# Примените схему
docker exec -i fortuna-bot-db psql -U postgres -d fortuna < init.sql
```

### Шаг 5: Запустите деплой

```bash
# Вернитесь на локальный компьютер
cd d:\pet\fortuna-telegram-bot-ts

# Закоммитьте workflow файлы
git add .github/workflows/
git add docker-compose.prod.yml
git add DEPLOY.md
git add QUICKSTART.md
git commit -m "Add CI/CD workflows"
git push origin master
```

## ✅ Проверка

1. Откройте: **GitHub → Repository → Actions**
2. Дождитесь завершения workflow (зеленая галочка)
3. Проверьте на сервере:

```bash
ssh user@server
cd ~/fortune-telegram-bot
docker-compose ps
docker-compose logs -f web
```

Должны увидеть: `✅ Fortuna Telegram Bot started successfully!`

## 🎯 Что дальше?

После первого успешного деплоя:
- Каждый `git push` в `master` → автоматический деплой
- Проверяйте логи: `docker-compose logs -f`
- Перезапуск: `docker-compose restart web`

## 🆘 Помощь

Если что-то не работает:
1. Проверьте GitHub Actions логи
2. Проверьте логи на сервере: `docker-compose logs`
3. Проверьте, что все 7 secrets заполнены
4. Убедитесь, что SSH ключ работает: `ssh -i ~/.ssh/fortuna_deploy user@server`

## 📚 Подробная инструкция

См. [DEPLOY.md](./DEPLOY.md) для детальной информации.

---

**Нужна помощь с настройкой?** Скажите на каком шаге застряли!
