# Out Time - Система учета рабочего времени

Полнофункциональная система учета рабочего времени с Telegram ботом и веб-панелью управления.

## 🎯 Описание

**Out Time** - это современная система для отслеживания рабочего времени сотрудников, состоящая из:

- **Telegram Bot** - для ежедневного учета времени сотрудниками
- **Web Dashboard** - для управления компанией и просмотра аналитики
- **API Backend** - для обработки данных и интеграции компонентов

## 🏗 Архитектура

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

## 🚀 Быстрый старт

### Требования

- **Node.js** 18+
- **PostgreSQL** 13+
- **pnpm** 8+
- **Telegram Bot Token** (от @BotFather)

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd out.time

# Установите зависимости для всего проекта
pnpm install

# Установите зависимости для backend и frontend
cd backend && pnpm install
cd ../frontend && pnpm install
cd ..
```

### 2. Настройка Backend

```bash
# Скопируйте файл с примерами переменных
cp backend/env.example backend/.env

# Отредактируйте backend/.env с вашими настройками
```

**Обязательные переменные окружения:**
```env
# Подключение к базе данных
DATABASE_URL=postgresql://username:password@localhost:5432/outtime_db

# JWT секрет для токенов
JWT_SECRET=your_super_secret_jwt_key_here

# Telegram Bot Token (получить у @BotFather)
BOT_TOKEN=your_telegram_bot_token_here

# Порт для API сервера
PORT=3000
```

### 3. Настройка Frontend

```bash
# Скопируйте файл с примерами переменных
cp frontend/env.example frontend/.env

# Настройте frontend/.env
```

**Переменные окружения Frontend:**
```env
# URL API (по умолчанию для разработки)
VITE_API_URL=http://localhost:3000/api
```

### 4. Настройка базы данных

```bash
# Создайте базу данных PostgreSQL
createdb outtime_db

# Запустите миграции
cd backend
pnpm migrate

# Или с тестовыми данными
pnpm migrate --seed
```

### 5. Запуск проекта

```bash
# Запуск всего проекта (backend + frontend)
pnpm dev

# Или раздельно:
pnpm dev:backend    # Только backend
pnpm dev:frontend   # Только frontend
```

**Доступные адреса:**
- 🌐 **Web-интерфейс**: http://localhost:5173
- 🔌 **API Backend**: http://localhost:3000
- 🤖 **Telegram Bot**: Найдите вашего бота в Telegram

## 📦 Структура проекта

```
out.time/
├── backend/                 # Node.js API + Telegram Bot
│   ├── src/
│   │   ├── controllers/     # API контроллеры
│   │   ├── services/        # Бизнес-логика
│   │   ├── models/          # Модели данных
│   │   ├── bot/             # Telegram Bot
│   │   └── routes/          # API роуты
│   ├── migrations/          # Миграции БД
│   └── server.js            # Точка входа
├── frontend/                # React приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы
│   │   ├── services/        # API клиенты
│   │   └── context/         # React Context
│   └── index.html
├── package.json             # Корневой пакет
└── pnpm-workspace.yaml      # Workspace конфигурация
```

## ✨ Основные возможности

### 🤖 Telegram Bot

- **Регистрация** сотрудников по пригласительным ссылкам
- **Автоуведомления** в 9:00 (начало дня) и 18:00 (отчет)
- **Статусы**: работа, опоздание, больничный, отпуск
- **Текстовые отчеты** о проделанной работе
- **Напоминания** для опоздавших сотрудников

### 💼 Web Dashboard

- **Панель управления** с аналитикой компании
- **Управление сотрудниками** (приглашения, статусы)
- **Просмотр отчетов** с фильтрацией и поиском
- **Экспорт данных** в Excel
- **Настройки** уведомлений и компании

### 🔌 API Features

- **RESTful API** для всех операций
- **JWT аутентификация** и авторизация
- **Валидация данных** и обработка ошибок
- **Автоматическое логирование**
- **Масштабируемая архитектура**

## 🛠 Команды разработки

```bash
# Разработка
pnpm dev                # Запуск всего проекта
pnpm dev:backend        # Только backend
pnpm dev:frontend       # Только frontend

# Сборка
pnpm build              # Сборка frontend

# База данных
cd backend
pnpm migrate            # Миграции
pnpm migrate --seed     # С тестовыми данными

# Тестирование
pnpm test               # Запуск тестов
```

## 📊 Использование

### Для администратора компании:

1. **Регистрация**: Зайдите на http://localhost:5173 и создайте компанию
2. **Настройка**: Настройте время уведомлений в разделе "Настройки"
3. **Приглашение**: Добавьте сотрудников через раздел "Сотрудники"
4. **Мониторинг**: Отслеживайте активность на дашборде

### Для сотрудников:

1. **Регистрация**: Перейдите по пригласительной ссылке от администратора
2. **Ежедневная работа**: Отвечайте на уведомления бота в 9:00 и 18:00
3. **Отчеты**: Отправляйте текстовые отчеты о проделанной работе

## 🔧 Настройка продакшена

### Environment Variables

```bash
# Backend Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/outtime_prod
JWT_SECRET=very_secure_random_string_here
BOT_TOKEN=production_bot_token

# Frontend Production  
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment

Проект готов для деплоя на любые платформы, поддерживающие Node.js:
- Heroku
- Vercel
- DigitalOcean App Platform
- AWS EC2
- VPS серверы

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

## 📄 Лицензия

Этот проект создан для внутреннего использования компании Outcasts.

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте документацию в папках `backend/` и `frontend/`
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте логи в `backend/logs/`
4. Обратитесь к команде разработки

---

**Сделано с ❤️ командой Outcasts** 