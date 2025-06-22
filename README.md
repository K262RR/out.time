# Out Time - Система учета рабочего времени

Система автоматического учета рабочего времени сотрудников через Telegram-бот с веб-панелью администратора.

## 🎯 Описание

**Out Time** - это современная система для отслеживания рабочего времени сотрудников, состоящая из:

- **Telegram Bot** - для ежедневного учета времени сотрудниками
- **Web Dashboard** - для управления компанией и просмотра аналитики
- **API Backend** - для обработки данных и интеграции компонентов

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
pnpm install:all

# Запуск в режиме разработки
pnpm dev
```

### Сборка для продакшена

```bash
# Сборка проекта для деплоя
pnpm run build:deploy
```

## 📦 Деплой на ISPmanager

Для развертывания на хостинге с ISPmanager:

1. **Соберите проект:**
   ```bash
   pnpm run build:deploy
   ```

2. **Следуйте инструкции:** `deploy-ispmanager.md`

3. **Основные шаги:**
   - Настройте домен в ISPmanager
   - Создайте базу данных PostgreSQL
   - Загрузите файлы на сервер
   - Настройте переменные окружения
   - Запустите приложение через PM2

## 🏗️ Архитектура

```
┌─────────────────┐    ┌──────────────────┐
│   Telegram Bot  │    │   Web Frontend   │
│                 │    │     (React)      │
└─────────┬───────┘    └────────┬─────────┘
          │                     │
          │ Webhook             │ HTTP/HTTPS
          │                     │
          └─────────────────────┼─────────────
                                │
                    ┌───────────▼────────────┐
                    │   API Backend          │
                    │   (Node.js + Express)  │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   PostgreSQL           │
                    │     Database           │
                    └────────────────────────┘
```

## 📋 Функции

### Telegram Bot
- Автоматические уведомления (9:00 и 18:00)
- Фиксация времени прихода/ухода
- Сбор ежедневных отчетов
- Обработка статусов (больничный, отпуск)

### Веб-панель
- Авторизация администратора
- Управление сотрудниками
- Просмотр отчетов и статистики
- Экспорт данных в Excel
- Настройки уведомлений

## 🔧 Настройка

### Переменные окружения

Создайте файл `.env` в папке `backend/`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/outtime
JWT_SECRET=your_jwt_secret
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### База данных

```bash
# Применение миграций
cd backend
pnpm run migrate

# Заполнение тестовыми данными
pnpm run migrate:seed
```

## 📱 Telegram Bot

### Команды
- `/start` - Регистрация сотрудника
- `/status` - Текущий статус
- `/help` - Справка

### Уведомления
- **9:00** - Утреннее уведомление о начале работы
- **18:00** - Запрос вечернего отчета

## 🌐 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация компании
- `POST /api/auth/login` - Авторизация

### Сотрудники
- `GET /api/employees` - Список сотрудников
- `GET /api/employees/:id` - Информация о сотруднике
- `POST /api/employees/invite` - Создание приглашения

### Отчеты
- `GET /api/reports` - Список отчетов
- `GET /api/reports/export` - Экспорт в Excel

### Telegram Bot
- `POST /api/bot/webhook` - Webhook для бота

## 🛠️ Разработка

### Структура проекта
```
├── backend/           # Node.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── routes/
│   ├── bot/           # Telegram Bot
│   └── migrations/    # Миграции БД
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── docs/              # Документация
```

### Скрипты
```bash
# Разработка
pnpm dev              # Запуск backend + frontend
pnpm dev:backend      # Только backend
pnpm dev:frontend     # Только frontend

# Продакшен
pnpm build            # Сборка фронтенда
pnpm start            # Запуск backend
pnpm run build:deploy # Полная сборка для деплоя
```

## 📊 База данных

### Основные таблицы
- `companies` - Компании
- `users` - Администраторы
- `employees` - Сотрудники
- `time_records` - Записи времени
- `reports` - Отчеты
- `invites` - Приглашения

## 🔒 Безопасность

- JWT токены для авторизации
- Хэширование паролей (bcrypt)
- Валидация всех входящих данных
- CORS настройки
- Helmet для HTTP заголовков

## 📈 Мониторинг

### Логирование
- Winston для структурированных логов
- Ротация логов
- Отдельные файлы для ошибок

### PM2 (продакшен)
```bash
# Управление процессом
pnpm run pm2:start
pnpm run pm2:restart
pnpm run pm2:stop
pnpm run pm2:logs
```

## 🚀 Деплой

### ISPmanager
Подробная инструкция: [deploy-ispmanager.md](deploy-ispmanager.md)

### Docker (альтернатива)
```bash
docker-compose up -d
```

## 📝 Лицензия

ISC License

## 👥 Команда

Outcasts Team

## 📝 Документация

- [Backend README](./backend/README.md) - Подробная документация API
- [Frontend README](./frontend/README.md) - Документация React приложения
- [Техническое задание](./Техническое%20задание.md) - Полные требования
- [UX сценарии](./UX-сценарии%20для%20Out%20Time.md) - Пользовательские сценарии

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте документацию в папках `backend/` и `frontend/`
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте логи в `backend/logs/`
4. Обратитесь к команде разработки

---

**Сделано с ❤️ командой Outcasts** 