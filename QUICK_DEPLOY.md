# 🚀 Быстрый деплой Out Time на Render.com

## 🎯 Шаги деплоя

### 1. Подготовка
```bash
# Загрузите код в GitHub репозиторий
git add .
git commit -m "Подготовка к деплою на Render"
git push origin main

# Получите Telegram Bot Token у @BotFather
```

### 2. Создайте сервисы в Render.com

**PostgreSQL:**
- New + → PostgreSQL
- Name: `outtime-db`
- Database: `outtime_prod` 
- Plan: Free

**Backend API:**
- New + → Web Service
- Connect GitHub repo
- Name: `outtime-backend`
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`

**Environment Variables Backend:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[auto from PostgreSQL]
JWT_SECRET=[generate random string]
BOT_TOKEN=[your telegram bot token]
API_BASE_URL=https://outtime-backend.onrender.com
FRONTEND_URL=https://outtime-frontend.onrender.com
TIMEZONE=Europe/Moscow
```

**Frontend:**
- New + → Static Site
- Same GitHub repo
- Name: `outtime-frontend`
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`

**Environment Variables Frontend:**
```
VITE_API_URL=https://outtime-backend.onrender.com/api
```

**Frontend Redirects:**
- Source: `/*` → Destination: `/index.html` (Status: 200)

### 3. Настройка Telegram Webhook
После деплоя backend выполните:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://outtime-backend.onrender.com/bot/webhook"}'
```

### 4. Проверка
- Backend: https://outtime-backend.onrender.com/health
- Frontend: https://outtime-frontend.onrender.com
- Telegram Bot: отправьте `/start`

## ✅ Готово!
Ваше приложение развернуто и готово к использованию. 