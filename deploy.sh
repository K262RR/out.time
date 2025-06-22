#!/bin/bash

# Скрипт деплоя Out Time на Render.com
echo "🚀 Деплой Out Time на Render.com"

# Проверяем наличие необходимых переменных
if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Переменная BOT_TOKEN не установлена"
    echo "Получите токен у @BotFather в Telegram и установите переменную окружения"
    exit 1
fi

# Устанавливаем зависимости для всего проекта
echo "📦 Установка зависимостей..."
npm install

# Собираем фронтенд
echo "🏗️ Сборка фронтенда..."
cd frontend
npm install
npm run build
cd ..

# Проверяем бэкенд
echo "🔍 Проверка бэкенда..."
cd backend
npm install

# Проверяем миграции
echo "🗄️ Проверка миграций базы данных..."
if [ "$NODE_ENV" = "production" ]; then
    echo "Миграции будут выполнены автоматически при первом запуске"
fi

cd ..

echo "✅ Подготовка к деплою завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Создайте репозиторий на GitHub"
echo "2. Загрузите код: git push origin main"
echo "3. Подключите репозиторий к Render.com"
echo "4. Установите переменную BOT_TOKEN в настройках Render"
echo "5. Запустите деплой через Render Dashboard" 