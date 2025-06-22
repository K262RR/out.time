# Out Time Backend

Backend система учета рабочего времени с Telegram ботом.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
pnpm install
```

### 2. Настройка переменных окружения
```bash
# Скопируйте файл примера
cp env.example .env

# Отредактируйте .env с вашими настройками
nano .env
```

**Обязательные переменные:**
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов  
- `BOT_TOKEN` - токен Telegram бота от @BotFather

### 3. Настройка базы данных

**Установка PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian  
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Создание базы данных
createdb outtime_db
```

**Запуск миграций:**
```bash
# Выполнить миграции
node migrations/migrate.js

# Или с тестовыми данными
node migrations/migrate.js --seed
```

### 4. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте токен в переменную `BOT_TOKEN`

### 5. Запуск сервера
```bash
# Режим разработки
pnpm dev

# Или обычный запуск
pnpm start
```

## 📁 Структура проекта

```
backend/
├── src/
│   ├── app.js              # Express приложение
│   ├── config/             # Конфигурации
│   ├── controllers/        # API контроллеры
│   ├── models/             # Модели данных
│   ├── services/           # Бизнес-логика
│   ├── middleware/         # Промежуточное ПО
│   ├── routes/             # API маршруты
│   ├── utils/              # Утилиты
│   └── bot/                # Telegram бот
│       ├── handlers/       # Обработчики команд
│       ├── keyboards/      # Клавиатуры
│       └── index.js        # Основной файл бота
├── migrations/             # Миграции БД
└── server.js               # Точка входа
```

## 🔌 API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация компании
- `POST /api/auth/login` - Авторизация
- `PUT /api/auth/password` - Смена пароля

### Сотрудники  
- `GET /api/employees` - Список сотрудников
- `GET /api/employees/:id` - Информация о сотруднике
- `POST /api/employees/invite` - Создание приглашения
- `PUT /api/employees/:id` - Обновление сотрудника

### Dashboard
- `GET /api/dashboard` - Данные для главной панели

### Отчеты
- `GET /api/reports` - Список отчетов с фильтрацией
- `GET /api/reports/export` - Экспорт в Excel
- `GET /api/reports/stats` - Статистика

### Bot API
- `POST /api/bot/register` - Регистрация сотрудника через бота
- `GET /api/bot/status/:telegramId` - Статус сотрудника
- `POST /api/bot/start-day` - Отметка начала дня
- `POST /api/bot/end-day` - Отметка конца дня и отчет

### Настройки
- `GET /api/settings` - Настройки компании
- `PUT /api/settings` - Обновление настроек

## 🤖 Telegram Bot

**Команды:**
- `/start` - Регистрация через пригласительную ссылку
- `/status` - Текущий статус работы
- `/help` - Справка

**Автоуведомления:**
- 9:00 - Утреннее уведомление о начале работы
- 18:00 - Вечернее уведомление с запросом отчета
- 10:00 - Напоминание опоздавшим

## 🗄️ База данных

**Таблицы:**
- `companies` - Компании
- `users` - Администраторы компаний  
- `employees` - Сотрудники
- `time_records` - Записи рабочего времени
- `reports` - Ежедневные отчеты
- `invites` - Пригласительные ссылки

## 🛠 Разработка

### Запуск в режиме разработки
```bash
# С автоперезагрузкой
pnpm dev

# Логи в реальном времени
tail -f logs/combined.log
```

### Тестирование
```bash
# Запуск тестов (когда будут написаны)
pnpm test

# Проверка линтера
pnpm lint
```

### Полезные команды
```bash
# Проверка подключения к БД
node -e "require('./src/config/database.js').query('SELECT NOW()')"

# Очистка базы данных
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Тестирование бота
node -e "require('./src/services/cronService.js').testNotifications(YOUR_TELEGRAM_ID)"
```

## 🚀 Деплой

### Production настройки
```bash
# Установите production переменные
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/outtime_prod
JWT_SECRET=very_secure_random_string_here
BOT_TOKEN=your_production_bot_token
```

### Docker (опционально)
```bash
# Создайте Dockerfile если нужен
docker build -t outtime-backend .
docker run -p 3000:3000 --env-file .env outtime-backend
```

## 📊 Мониторинг

**Healthcheck:**
```bash
curl http://localhost:3000/health
```

**Логи:**
- `logs/error.log` - Ошибки
- `logs/combined.log` - Все логи

## ❗ Troubleshooting

**База данных недоступна:**
```bash
# Проверьте статус PostgreSQL
brew services list | grep postgres
# или
sudo systemctl status postgresql
```

**Бот не отвечает:**
- Проверьте BOT_TOKEN в .env
- Убедитесь что бот не заблокирован у @BotFather
- Проверьте логи сервера

**API не работает:**
- Проверьте что сервер запущен на правильном порту
- Убедитесь что нет конфликтов портов
- Проверьте логи Express.js

## 🔧 Настройка для Outcasts

**Тестовые данные:**
- Email: `admin@outcasts.dev`
- Пароль: `admin123`

**После первого запуска:**
1. Войдите в веб-панель с тестовыми данными
2. Смените пароль администратора
3. Создайте приглашения для сотрудников
4. Протестируйте бота с реальными пользователями

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в `logs/`
2. Убедитесь что все переменные окружения установлены
3. Проверьте подключение к базе данных
4. Протестируйте API через Postman или curl 