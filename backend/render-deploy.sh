#!/bin/bash

# Скрипт деплоя backend на Render.com
echo "🚀 Деплой Backend на Render"

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

# Проверяем подключение к базе данных и выполняем миграции
echo "🗄️ Выполнение миграций базы данных..."
if [ -n "$DATABASE_URL" ]; then
    node migrations/migrate.js --seed
    echo "✅ Миграции выполнены успешно"
else
    echo "⚠️ DATABASE_URL не установлен, пропускаем миграции"
fi

echo "✅ Backend готов к запуску!" 