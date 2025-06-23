#!/bin/bash
set -e

echo "🚀 Подготовка к сборке..."

# Сохраняем оригинальный package.json
cp package.json package.json.backup

# Используем упрощенный package.json для сборки
cp package-render.json package.json

echo "📦 Установка зависимостей..."
npm install

echo "🏗️ Сборка проекта..."
npm run build

echo "🔄 Восстановление оригинального package.json..."
mv package.json.backup package.json

echo "✅ Сборка завершена!"
ls -la dist/ 