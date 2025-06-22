#!/bin/bash

# Скрипт для сборки проекта Out Time перед деплоем на ISPmanager

echo "🚀 Начинаем сборку проекта Out Time..."

# Проверяем наличие pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm не установлен. Установите pnpm: npm install -g pnpm"
    exit 1
fi

# Очищаем предыдущие сборки
echo "🧹 Очищаем предыдущие сборки..."
rm -rf frontend/dist
rm -rf backend/node_modules

# Устанавливаем зависимости для фронтенда
echo "📦 Устанавливаем зависимости фронтенда..."
cd frontend
pnpm install

# Собираем фронтенд
echo "🔨 Собираем фронтенд..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке фронтенда"
    exit 1
fi

echo "✅ Фронтенд собран успешно"

# Возвращаемся в корень и устанавливаем зависимости для бэкенда
echo "📦 Устанавливаем зависимости бэкенда..."
cd ../backend
pnpm install --production

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей бэкенда"
    exit 1
fi

# Создаем папку для логов если её нет
mkdir -p logs

# Создаем архив для деплоя
echo "📦 Создаем архив для деплоя..."
cd ..
tar -czf outtime-deploy.tar.gz \
    frontend/dist/ \
    backend/ \
    .htaccess \
    deploy-ispmanager.md

echo "✅ Сборка завершена успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите файл outtime-deploy.tar.gz на сервер"
echo "2. Распакуйте архив в public_html/"
echo "3. Следуйте инструкции в deploy-ispmanager.md"
echo ""
echo "📁 Структура файлов для загрузки:"
echo "public_html/"
echo "├── index.html (из frontend/dist/)"
echo "├── assets/ (из frontend/dist/)"
echo "├── .htaccess"
echo "└── backend/"
echo "    ├── server.js"
echo "    ├── package.json"
echo "    ├── ecosystem.config.js"
echo "    ├── src/"
echo "    └── migrations/" 