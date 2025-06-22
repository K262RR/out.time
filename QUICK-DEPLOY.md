# 🚀 Быстрый деплой Out Time на ISPmanager

## 1. Подготовка проекта
```bash
# Сборка проекта
pnpm run build:deploy
```

## 2. Настройка ISPmanager

### 2.1 Создание домена
- Войдите в ISPmanager
- Создайте домен/поддомен
- Включите Node.js поддержку

### 2.2 База данных
- Создайте PostgreSQL базу данных
- Запишите данные подключения

## 3. Загрузка файлов

### 3.1 Распакуйте архив
```bash
tar -xzf outtime-deploy.tar.gz -C public_html/
```

### 3.2 Структура файлов
```
public_html/
├── index.html          # Фронтенд
├── assets/             # Статические файлы
├── .htaccess           # Apache конфигурация
└── backend/            # Node.js приложение
    ├── server.js
    ├── package.json
    ├── ecosystem.config.js
    └── src/
```

## 4. Настройка переменных окружения

### 4.1 Создайте .env файл
```bash
cd public_html/backend
cp env.production.example .env
```

### 4.2 Заполните переменные
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your_super_secret_jwt_key_here
BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
```

## 5. Запуск приложения

### 5.1 Установка зависимостей
```bash
cd public_html/backend
pnpm install --production
```

### 5.2 Настройка базы данных
```bash
node migrations/migrate.js
```

### 5.3 Запуск через PM2
```bash
pnpm run pm2:start
```

## 6. Настройка Telegram Bot

### 6.1 Webhook URL
```
https://your-domain.com/bot/webhook
```

### 6.2 Проверка
Отправьте `/start` боту

## 7. Проверка работы

### 7.1 API
```bash
curl https://your-domain.com/api/health
```

### 7.2 Фронтенд
Откройте сайт в браузере

## 8. Управление

### 8.1 Логи
```bash
cd public_html/backend
pnpm run pm2:logs
```

### 8.2 Перезапуск
```bash
pnpm run pm2:restart
```

## ⚠️ Важные моменты

1. **SSL**: Включите SSL в ISPmanager
2. **Порты**: Убедитесь, что порт 3000 доступен
3. **Права**: Проверьте права доступа к файлам
4. **Логи**: Регулярно проверяйте логи приложения

## 🆘 Устранение неполадок

### Приложение не запускается
```bash
# Проверьте логи
pnpm run pm2:logs

# Проверьте переменные окружения
cat .env

# Проверьте статус PM2
pm2 status
```

### API не отвечает
- Проверьте .htaccess файл
- Убедитесь, что приложение запущено
- Проверьте настройки прокси в ISPmanager

### Проблемы с базой данных
- Проверьте подключение к PostgreSQL
- Убедитесь, что миграции применены
- Проверьте права доступа пользователя БД 