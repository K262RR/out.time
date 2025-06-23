# 🔧 Решение "Cannot find module vite" на Render

## Проблема
```
Error: Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'
```

## ✅ Применены исправления:

1. **Удален packageManager** из package.json (конфликт pnpm vs npm)
2. **Создан build.sh** с принудительной установкой devDependencies
3. **Обновлен build скрипт** на `npx vite build`
4. **Добавлены fallback команды** в render.yaml

## 🚀 Финальная конфигурация

**render.yaml:**
```yaml
buildCommand: chmod +x build.sh && ./build.sh
```

**build.sh:**
```bash
#!/bin/bash
set -e
npm install --include=dev
npx vite build
```

**package.json:**
```json
{
  "scripts": {
    "build": "npx vite build"
  }
}
```

## 📋 Альтернативы если не работает:

1. `buildCommand: npm install --include=dev && npm run build`
2. `buildCommand: npm install --production=false && npm run build`
3. `buildCommand: npm install && npx vite build`

Теперь Vite должен найтись и сборка пройти успешно! 🎉 