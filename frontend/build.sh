#!/bin/bash
set -e

echo "🔧 Установка зависимостей..."

# Убеждаемся что используем npm, а не pnpm
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Устанавливаем зависимости включая dev
npm install --include=dev

echo "📦 Установленные пакеты:"
npm list --depth=0

echo "🏗️ Запуск сборки..."

# Пробуем разные способы запуска vite
if command -v npx &> /dev/null; then
    echo "Используем npx vite build"
    npx vite build
elif [ -f "./node_modules/.bin/vite" ]; then
    echo "Используем ./node_modules/.bin/vite build"
    ./node_modules/.bin/vite build
else
    echo "❌ Vite не найден"
    exit 1
fi

echo "✅ Сборка завершена!" 