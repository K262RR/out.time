# 🚀 Деплой Out Time на Render.com

Это руководство поможет вам развернуть приложение Out Time на платформе Render.com.

## 📋 Предварительные требования

1. **Аккаунт на Render.com** - [зарегистрируйтесь здесь](https://render.com)
2. **Telegram Bot Token** - получите у [@BotFather](https://t.me/BotFather)
3. **GitHub репозиторий** - загрузите код проекта

## 🔧 Подготовка проекта

### 1. Подготовка кода
```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd out.time

# Сделайте deploy.sh исполняемым
chmod +x deploy.sh
chmod +x backend/render-deploy.sh
```

### 2. Создание Telegram бота
1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните полученный токен (понадобится позже)

## 🗄️ Настройка базы данных

### 1. Создание PostgreSQL базы
1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"PostgreSQL"**
3. Заполните данные:
   - **Name**: `outtime-db`
   - **Database**: `outtime_prod`
   - **User**: `outtime_user`
   - **Region**: выберите ближайший регион
   - **Plan**: Free
4. Нажмите **"Create Database"**
5. Дождитесь создания (займет ~2-3 минуты)
6. Скопируйте **External Database URL** (понадобится для backend)

## 🔙 Деплой Backend API

### 1. Создание Web Service
1. В Render Dashboard нажмите **"New +"** → **"Web Service"**
2. Подключите ваш GitHub репозиторий
3. Заполните настройки:
   - **Name**: `outtime-backend`
   - **Region**: тот же, что и база данных
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2. Настройка переменных окружения
В разделе **Environment** добавьте:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<ваш-database-url-из-пункта-1>
JWT_SECRET=<сгенерируйте-длинную-случайную-строку>
BOT_TOKEN=<ваш-telegram-bot-token>
API_BASE_URL=https://outtime-backend.onrender.com
FRONTEND_URL=https://outtime-frontend.onrender.com
TIMEZONE=Europe/Moscow
MORNING_NOTIFICATION_TIME=09:00
EVENING_NOTIFICATION_TIME=18:00
```

### 3. Дополнительные настройки
- **Health Check Path**: `/health`
- **Auto-Deploy**: включить

Нажмите **"Create Web Service"**

## 🎨 Деплой Frontend

### 1. Создание Static Site
1. В Render Dashboard нажмите **"New +"** → **"Static Site"**
2. Подключите тот же GitHub репозиторий
3. Заполните настройки:
   - **Name**: `outtime-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2. Настройка переменных окружения
В разделе **Environment** добавьте:

```bash
VITE_API_URL=https://outtime-backend.onrender.com/api
```

### 3. Настройка редиректов
В разделе **Redirects/Rewrites** добавьте:
- **Source**: `/*`
- **Destination**: `/index.html`
- **Status**: `200 (Rewrite)`

Нажмите **"Create Static Site"**

## ⚙️ Настройка Telegram бота

После успешного деплоя backend:

1. Получите URL вашего backend: `https://outtime-backend.onrender.com`
2. Установите Webhook для бота:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://outtime-backend.onrender.com/bot/webhook"}'
```

3. Проверьте статус webhook:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## ✅ Проверка деплоя

### 1. Backend
- Откройте: `https://outtime-backend.onrender.com/health`
- Должен вернуть: `{"status": "OK", ...}`

### 2. Frontend  
- Откройте: `https://outtime-frontend.onrender.com`
- Должна загрузиться страница входа

### 3. Telegram Bot
- Найдите вашего бота в Telegram
- Отправьте `/start`
- Бот должен ответить

## 📊 Мониторинг

### Логи Backend
1. Откройте Render Dashboard
2. Выберите `outtime-backend`
3. Перейдите на вкладку **Logs**

### Логи Frontend
1. Откройте Render Dashboard  
2. Выберите `outtime-frontend`
3. Перейдите на вкладку **Logs**

## 🔧 Управление

### Перезапуск сервисов
1. В Render Dashboard выберите сервис
2. Нажмите **"Manual Deploy"** → **"Clear build cache & deploy"**

### Обновление переменных окружения
1. Выберите сервис
2. Перейдите в **Environment** 
3. Измените значения
4. Сервис автоматически перезапустится

## 🐛 Troubleshooting

### Backend не запускается
- Проверьте логи в Render Dashboard
- Убедитесь, что `DATABASE_URL` правильный
- Проверьте, что `BOT_TOKEN` установлен

### База данных недоступна
- Проверьте статус PostgreSQL сервиса
- Убедитесь, что backend и база в одном регионе
- Проверьте формат `DATABASE_URL`

### Telegram бот не отвечает
- Проверьте, что webhook установлен
- Убедитесь, что `BOT_TOKEN` правильный
- Проверьте логи backend на ошибки

### Frontend не загружается
- Проверьте, что `VITE_API_URL` правильный
- Убедитесь, что настроены редиректы
- Проверьте логи сборки

## 💰 Стоимость

На бесплатном плане Render:
- ✅ PostgreSQL: 1 ГБ, 90 дней сна
- ✅ Web Service: 750 часов/месяц
- ✅ Static Site: 100 ГБ трафика

## 🔄 Автоматическое обновление

Настройка автодеплоя при изменениях в Git:
1. В настройках каждого сервиса включите **Auto-Deploy**
2. При push в `main` ветку сервисы обновятся автоматически

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте статус всех сервисов
4. Обратитесь к [документации Render](https://render.com/docs) 