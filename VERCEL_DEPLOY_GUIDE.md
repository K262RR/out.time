# 🚀 Деплой фронтенда на Vercel

## Почему Vercel?
- ✅ Автоматически определяет Vite проекты
- ✅ Отличная поддержка React
- ✅ Быстрый деплой из GitHub
- ✅ Бесплатный план
- ✅ Автоматические превью для Pull Request'ов

## 📋 Пошаговая инструкция

### Шаг 1: Подготовка кода
```bash
git add .
git commit -m "Setup Vercel deployment config"
git push origin main
```

### Шаг 2: Создание проекта на Vercel
1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **"Sign up"** или **"Login"** через GitHub
3. Нажмите **"New Project"**
4. Выберите ваш репозиторий `out.time`
5. Настройте проект:

**⚙️ Project Settings:**
```
Project Name: outtime-frontend
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build (автоматически)
Output Directory: dist (автоматически)
Install Command: npm install (автоматически)
```

**🔧 Environment Variables:**
```
VITE_API_URL = https://outtime-backend.onrender.com/api
```

6. Нажмите **"Deploy"**

### Шаг 3: Обновление backend настроек
После деплоя вы получите URL вида: `https://your-project-name.vercel.app`

Обновите переменную окружения в Render backend:
```
FRONTEND_URL = https://your-project-name.vercel.app
```

### Шаг 4: Проверка
1. **Frontend:** `https://your-project-name.vercel.app`
2. **Backend API:** `https://outtime-backend.onrender.com/health`
3. **CORS:** Убедитесь что frontend может обращаться к API

## 🔧 Конфигурация

### vercel.json (уже создан)
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://outtime-backend.onrender.com/api"
  }
}
```

### package.json (текущая версия работает)
```json
{
  "scripts": {
    "build": "npx vite build"
  },
  "dependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## 🎯 Преимущества этого подхода

### Backend на Render:
- ✅ Подходит для Node.js API
- ✅ Поддержка PostgreSQL
- ✅ Telegram bot работает

### Frontend на Vercel:
- ✅ Отлично для React/Vite
- ✅ CDN по всему миру
- ✅ Автоматические деплои
- ✅ Нет проблем с модулями

## 🔄 Автоматические деплои

После настройки каждый push в main ветку будет:
1. **Vercel** - автоматически соберет и задеплоит frontend
2. **Render** - автоматически пересоберет и перезапустит backend

## 🐛 Решение проблем

### CORS ошибки:
Убедитесь что в backend добавлен Vercel URL в CORS:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-project-name.vercel.app',
  process.env.FRONTEND_URL
]
```

### API не работает:
1. Проверьте что backend запущен: `https://outtime-backend.onrender.com/health`
2. Проверьте VITE_API_URL в Vercel Environment Variables
3. Проверьте CORS настройки в backend

### Routing не работает:
`vercel.json` уже настроен для SPA routing через rewrites.

## 📊 Итоговая архитектура

```
GitHub Repository
├── backend/ → Render.com (API + Bot + Database)
└── frontend/ → Vercel.com (React App)
```

**URLs:**
- Frontend: `https://your-project-name.vercel.app`
- Backend API: `https://outtime-backend.onrender.com/api`
- Backend Health: `https://outtime-backend.onrender.com/health`

## ✅ Готово!

После деплоя у вас будет:
- 🚀 Быстрый фронтенд на Vercel
- 🔧 Надежный backend на Render  
- 🗄️ PostgreSQL база на Render
- 🤖 Telegram bot на Render

Никаких проблем с модулями Vite! 🎉 