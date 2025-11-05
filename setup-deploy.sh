#!/bin/bash

# 🚀 Скрипт для быстрой настройки деплоя на сервер
# Запустите: bash setup-deploy.sh

set -e

echo "🔧 Настройка GitHub Actions для автоматического деплоя"
echo "======================================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: Запустите скрипт из корня проекта fortuna-telegram-bot-ts${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Вам нужно будет ввести следующие данные:${NC}"
echo "  1. IP адрес сервера"
echo "  2. Токен Telegram бота"
echo ""

# Запрос данных
read -p "Введите IP адрес сервера: " SERVER_IP
read -p "Введите токен Telegram бота: " TELEGRAM_TOKEN

echo ""
echo -e "${GREEN}✓ Данные получены${NC}"
echo ""

# Создание SSH ключа
echo "🔑 Создание SSH ключа для GitHub Actions..."
SSH_KEY_PATH="$HOME/.ssh/fortuna_deploy"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠ SSH ключ уже существует: $SSH_KEY_PATH${NC}"
    read -p "Пересоздать ключ? (y/N): " RECREATE
    if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    else
        echo "Используем существующий ключ"
    fi
fi

if [ ! -f "$SSH_KEY_PATH" ]; then
    ssh-keygen -t ed25519 -C "github-actions@fortuna-bot" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✓ SSH ключ создан${NC}"
fi

# Копирование публичного ключа на сервер
echo ""
echo "📤 Копирование публичного ключа на сервер..."
echo -e "${YELLOW}Вам нужно будет ввести пароль root пользователя на сервере${NC}"

ssh-copy-id -i "$SSH_KEY_PATH.pub" root@$SERVER_IP

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Публичный ключ скопирован на сервер${NC}"
else
    echo -e "${RED}❌ Ошибка при копировании ключа. Попробуйте вручную:${NC}"
    echo "ssh-copy-id -i $SSH_KEY_PATH.pub root@$SERVER_IP"
    exit 1
fi

# Проверка подключения
echo ""
echo "🔍 Проверка SSH подключения..."
ssh -i "$SSH_KEY_PATH" -o BatchMode=yes -o ConnectTimeout=5 root@$SERVER_IP "echo 'Connection OK'" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSH подключение работает${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться по SSH${NC}"
    exit 1
fi

# Вывод инструкций
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Локальная настройка завершена!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Следующие шаги:${NC}"
echo ""
echo "1️⃣  Добавьте следующие secrets в GitHub:"
echo "   Перейдите: https://github.com/kamran134/fortuna-telegram-bot-ts/settings/secrets/actions"
echo ""
echo "   Нажмите 'New repository secret' и добавьте:"
echo ""
echo "   ┌─────────────────────┬───────────────────────────────────┐"
echo "   │ Name                │ Value                             │"
echo "   ├─────────────────────┼───────────────────────────────────┤"
echo "   │ SERVER_HOST         │ $SERVER_IP                        │"
echo "   │ SERVER_USER         │ root                              │"
echo "   │ SERVER_PORT         │ 22                                │"
echo "   │ SERVER_PATH         │ /root/fortune-telegram-bot        │"
echo "   │ TELEGRAM_TOKEN      │ $TELEGRAM_TOKEN                   │"
echo "   │ DATABASE_PASSWORD   │ plk_S2%92                         │"
echo "   └─────────────────────┴───────────────────────────────────┘"
echo ""
echo "   Для SSH_PRIVATE_KEY выполните:"
echo "   cat $SSH_KEY_PATH"
echo ""
echo "   Скопируйте ВЕСЬ вывод (включая BEGIN и END строки)"
echo ""
echo "2️⃣  Обновите docker-compose.yml на сервере:"
echo "   ssh root@$SERVER_IP"
echo "   cd /root/fortune-telegram-bot"
echo "   nano docker-compose.yml"
echo ""
echo "   Замените image на:"
echo "   ghcr.io/kamran134/fortuna-telegram-bot-ts:latest"
echo ""
echo "3️⃣  Создайте .env файл на сервере:"
echo "   cat > /root/fortune-telegram-bot/.env << 'EOF'"
echo "   TELEGRAM_TOKEN=$TELEGRAM_TOKEN"
echo "   DATABASE_PASSWORD=plk_S2%92"
echo "   CREATOR_IDS=963292126,112254199"
echo "   EOF"
echo ""
echo "4️⃣  Инициализируйте БД (если первый запуск):"
echo "   cd /root/fortune-telegram-bot"
echo "   docker-compose up -d db"
echo "   Скопируйте init.sql и примените его"
echo ""
echo "5️⃣  Запустите деплой:"
echo "   git add ."
echo "   git commit -m 'Setup CI/CD'"
echo "   git push origin master"
echo ""
echo -e "${GREEN}🎉 После этого каждый push будет автоматически деплоиться!${NC}"
echo ""
