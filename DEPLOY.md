# 🚀 Инструкция по настройке GitHub Actions для деплоя

## 📋 Шаг 1: Подготовка SSH ключа

### 1.1 Создайте SSH ключ на вашем компьютере (если еще нет)

```bash
ssh-keygen -t ed25519 -C "github-actions@fortuna-bot" -f ~/.ssh/fortuna_deploy
```

Будут созданы 2 файла:
- `~/.ssh/fortuna_deploy` - приватный ключ (для GitHub Secrets)
- `~/.ssh/fortuna_deploy.pub` - публичный ключ (для сервера)

### 1.2 Скопируйте публичный ключ на сервер

```bash
ssh-copy-id -i ~/.ssh/fortuna_deploy.pub user@your-server-ip
```

Или вручную добавьте содержимое `fortuna_deploy.pub` в файл `~/.ssh/authorized_keys` на сервере.

### 1.3 Проверьте подключение

```bash
ssh -i ~/.ssh/fortuna_deploy user@your-server-ip
```

## 📋 Шаг 2: Настройка GitHub Secrets

Перейдите в настройки репозитория:
```
GitHub → Ваш репозиторий → Settings → Secrets and variables → Actions
```

### Нажмите "New repository secret" и добавьте следующие секреты:

#### 1. `SERVER_HOST`
Значение: IP адрес или домен вашего сервера
```
Пример: 123.45.67.89
или: fortuna.example.com
```

#### 2. `SERVER_USER`
Значение: Имя пользователя для SSH подключения
```
Пример: root
или: ubuntu
или: kamran
```

#### 3. `SERVER_PORT`
Значение: SSH порт (обычно 22)
```
22
```

#### 4. `SERVER_PATH`
Значение: Путь к папке с docker-compose.yml на сервере
```
Пример: /root/fortune-telegram-bot
или: /home/ubuntu/fortune-telegram-bot
или: ~/fortune-telegram-bot
```

#### 5. `SSH_PRIVATE_KEY`
Значение: Содержимое приватного SSH ключа

```bash
# Скопируйте содержимое файла:
cat ~/.ssh/fortuna_deploy

# Должно выглядеть так:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(много строк)
...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ ВАЖНО:** Скопируйте ВЕСЬ ключ включая строки BEGIN и END!

#### 6. `TELEGRAM_TOKEN`
Значение: Токен вашего Telegram бота
```
Пример: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### 7. `DATABASE_PASSWORD`
Значение: Пароль от PostgreSQL
```
Ваш пароль (из docker-compose.yml)
```

## 📋 Шаг 3: Обновите docker-compose.yml на сервере

Ваш текущий `docker-compose.yml` нужно обновить для нового проекта:

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
    image: redis:latest
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

**⚠️ ВАЖНО:** Обратите внимание на изменение имени образа:
- Было: `ghcr.io/kamran134/fortuna-telegram-bot:latest`
- Стало: `ghcr.io/kamran134/fortuna-telegram-bot-ts:latest`

## 📋 Шаг 4: Создайте .env файл на сервере

На сервере в папке с `docker-compose.yml`:

```bash
cd ~/fortune-telegram-bot
nano .env
```

Добавьте:
```env
TELEGRAM_TOKEN=ваш_токен_бота
DATABASE_PASSWORD=plk_S2%92
CREATOR_IDS=963292126,112254199
```

## 📋 Шаг 5: Настройте Container Registry на GitHub

### 5.1 Сделайте пакет публичным (опционально)

```
GitHub → Profile → Packages → fortuna-telegram-bot-ts → Package settings
→ Change package visibility → Public
```

Или оставьте приватным и настройте токен для pull.

### 5.2 Если пакет приватный - создайте Personal Access Token

```
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
→ Generate new token
```

Права: `read:packages`

Добавьте этот токен на сервер:

```bash
docker login ghcr.io -u kamran134 -p ваш_токен
```

## 📋 Шаг 6: Инициализация БД на сервере

Если это первый запуск, нужно инициализировать БД:

```bash
cd ~/fortune-telegram-bot

# Скопируйте init.sql из репозитория на сервер
# Или создайте вручную

# Запустите только БД
docker-compose up -d db

# Примените SQL схему
docker exec -i fortune-telegram-bot-db-1 psql -U postgres -d fortuna < init.sql

# Проверьте
docker exec -it fortune-telegram-bot-db-1 psql -U postgres -d fortuna -c "\dt"
```

## 📋 Шаг 7: Тестовый деплой

### 7.1 Коммит и пуш

```bash
cd d:\pet\fortuna-telegram-bot-ts
git add .
git commit -m "Add GitHub Actions workflow"
git push origin master
```

### 7.2 Следите за процессом

```
GitHub → Repository → Actions → Выберите последний workflow
```

### 7.3 Проверьте деплой на сервере

```bash
ssh user@server
cd ~/fortune-telegram-bot
docker-compose ps
docker-compose logs -f web
```

## 📋 Шаг 8: Проверочный список

- [ ] SSH ключ создан и добавлен на сервер
- [ ] Все 7 secrets добавлены в GitHub
- [ ] docker-compose.yml обновлен на сервере (новое имя образа)
- [ ] .env файл создан на сервере
- [ ] БД инициализирована (init.sql применён)
- [ ] Workflow файлы добавлены в репозиторий
- [ ] Push в master запускает деплой

## 🔧 Troubleshooting

### Ошибка: "Permission denied (publickey)"
```bash
# Проверьте права на приватный ключ
chmod 600 ~/.ssh/fortuna_deploy

# Проверьте, что публичный ключ на сервере
ssh user@server "cat ~/.ssh/authorized_keys | grep fortuna"
```

### Ошибка: "docker: command not found"
```bash
# Установите Docker на сервере
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Ошибка: "Cannot pull image"
```bash
# Залогиньтесь в ghcr.io на сервере
docker login ghcr.io -u kamran134 -p your_github_token
```

## 🎯 Как работает деплой

1. **Push в master** → Запускается GitHub Action
2. **Build** → Собирается Docker образ из TypeScript проекта
3. **Push** → Образ загружается в ghcr.io
4. **SSH** → Подключение к серверу
5. **Pull** → Скачивание нового образа на сервер
6. **Deploy** → Перезапуск контейнеров
7. **Check** → Проверка статуса

## 📊 Мониторинг

### Просмотр логов на сервере
```bash
docker-compose logs -f web
docker-compose logs -f db
docker-compose logs -f redis
```

### Статус контейнеров
```bash
docker-compose ps
```

### Перезапуск при необходимости
```bash
docker-compose restart web
```

## 🔄 Ручной деплой (если нужно)

```bash
ssh user@server
cd ~/fortune-telegram-bot
docker-compose pull
docker-compose up -d
```

## 🎉 Готово!

Теперь при каждом push в master ваш бот будет автоматически деплоиться на сервер!

---

**Нужна помощь?** 
- Проверьте логи в GitHub Actions
- Проверьте логи на сервере: `docker-compose logs`
- Убедитесь, что все secrets правильно заполнены
