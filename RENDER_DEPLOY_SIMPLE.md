# 🚀 Упрощенное руководство по деплою на Render.com

## Проблема с render.yaml
PostgreSQL сервис в `render.yaml` имеет ограниченный синтаксис, поэтому лучше создать базу данных вручную.

## 📋 Пошаговая инструкция

### Шаг 1: Создайте PostgreSQL базу данных вручную
1. Зайдите на [render.com](https://render.com)
2. Нажмите **"New"** → **"PostgreSQL"**
3. Заполните:
   - **Name:** `outtime-database`
   - **Database:** `outtime_prod` (или оставьте по умолчанию)
   - **User:** `outtime_user` (или оставьте по умолчанию)
   - **Region:** выберите ближайший
   - **Plan:** Free
4. Нажмите **"Create Database"**
5. **Скопируйте Internal Database URL** - он понадобится для backend

### Шаг 2: Создайте Backend сервис
1. Нажмите **"New"** → **"Web Service"**
2. Подключите ваш GitHub репозиторий
3. Заполните:
   - **Name:** `outtime-backend`
   - **Region:** тот же что и БД
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Добавьте переменные окружения:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Internal Database URL из шага 1]
   JWT_SECRET=[Сгенерируйте длинную случайную строку]
   BOT_TOKEN=[Токен от @BotFather в Telegram]
   API_BASE_URL=https://[your-service-name].onrender.com
   FRONTEND_URL=https://[your-frontend-name].onrender.com
   ```

5. Нажмите **"Create Web Service"**

### Шаг 3: Создайте Frontend сервис
1. Нажмите **"New"** → **"Static Site"**
2. Подключите тот же GitHub репозиторий
3. Заполните:
   - **Name:** `outtime-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Добавьте переменную окружения:**
   ```
   VITE_API_URL=https://[your-backend-name].onrender.com/api
   ```

5. Нажмите **"Create Static Site"**

### Шаг 4: Альтернативно - использование Blueprint
Если хотите использовать обновленный `render.yaml`:

1. Сначала создайте PostgreSQL базу вручную (Шаг 1)
2. Обновите `DATABASE_URL` в переменных окружения backend
3. Используйте **"New"** → **"Blueprint"** и выберите ваш репозиторий

## ✅ Проверка после деплоя

1. **Backend Health Check:**
   ```
   https://your-backend-name.onrender.com/health
   ```
   Должен вернуть: `{"status":"OK","timestamp":"...","service":"OutTime Backend"}`

2. **API Documentation:**
   ```
   https://your-backend-name.onrender.com/api-docs
   ```

3. **Frontend:**
   ```
   https://your-frontend-name.onrender.com
   ```

## 🔧 Важные моменты

- **База данных создается ПЕРВОЙ** - без неё backend не запустится
- **Internal Database URL** - используйте именно internal, не external
- **Free план засыпает** через 15 минут бездействия
- **Первый запуск** может занять 2-3 минуты

## 🐛 Решение проблем

### Backend не запускается:
1. Проверьте логи в Render Dashboard
2. Убедитесь что `DATABASE_URL` установлен корректно
3. Проверьте что `BOT_TOKEN` валидный

### Frontend не загружается:
1. Проверьте что `VITE_API_URL` указывает на правильный backend URL
2. Убедитесь что `npm run build` выполняется без ошибок

### База данных недоступна:
1. Проверьте что PostgreSQL сервис запущен
2. Используйте Internal Database URL, не External

## 📝 Итоговая конфигурация render.yaml

Обновленный файл теперь создает только Backend и Frontend, PostgreSQL создается вручную:

```yaml
services:
  # Backend API сервис
  - type: web
    name: outtime-backend
    runtime: node
    plan: free
    rootDir: ./backend
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: BOT_TOKEN
        sync: false

  # Frontend статический сайт
  - type: web
    name: outtime-frontend
    runtime: static
    plan: free
    rootDir: ./frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        value: https://outtime-backend.onrender.com/api
```

Теперь деплой должен пройти без ошибок! 🎉 