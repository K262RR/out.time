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

### 2.3 Настройка SSL/HTTPS

#### 2.3.1 Установка Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo dnf install -y certbot python3-certbot-nginx

# macOS
brew install certbot
```

#### 2.3.2 Получение SSL сертификата
```bash
# Получение сертификата с автоматической настройкой nginx
sudo certbot --nginx -d your-domain.com

# Если нужно добавить поддомены
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

#### 2.3.3 Настройка автоматического обновления
```bash
# Проверка статуса автообновления
sudo systemctl status certbot.timer

# Тестовое обновление (dry-run)
sudo certbot renew --dry-run

# Настройка автоматического обновления (если не настроено)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### 2.3.4 Проверка конфигурации
```bash
# Проверка конфигурации nginx
sudo nginx -t

# Перезапуск nginx после изменений
sudo systemctl restart nginx

# Проверка статуса
sudo systemctl status nginx
```

#### 2.3.5 Обновление переменных окружения
```bash
# Создание .env файла из примера
cp env.production.example .env

# Обновление переменных (используйте свой редактор)
nano .env

# Проверка прав доступа
chmod 600 .env
```

Необходимые изменения в .env:
```env
# Обязательные SSL переменные
DOMAIN=https://your-domain.com
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
SSL_CHAIN_PATH=/etc/letsencrypt/live/your-domain.com/chain.pem
WEBHOOK_SECRET=your_secure_random_string_here

# Обновите URL для HTTPS
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com
```

#### 2.3.6 Проверка безопасности

1. **Базовые проверки:**
   ```bash
   # Проверка редиректа
   curl -I http://your-domain.com
   
   # Проверка HTTPS
   curl -I https://your-domain.com
   
   # Проверка SSL сертификата
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

2. **SSL Labs тест:**
   - Откройте https://www.ssllabs.com/ssltest/
   - Введите ваш домен
   - Дождитесь результатов теста (обычно 2-3 минуты)
   - Убедитесь, что оценка A или A+

3. **Проверка заголовков безопасности:**
   ```bash
   curl -I https://your-domain.com | grep -i "strict\|content\|frame\|xss\|sniff"
   ```

#### 2.3.7 Устранение проблем

1. **Сертификат не обновляется:**
   ```bash
   # Проверка логов
   sudo certbot certificates
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   ```

2. **Проблемы с nginx:**
   ```bash
   # Проверка ошибок
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

3. **SSL не работает:**
   ```bash
   # Проверка прав доступа
   sudo ls -la /etc/letsencrypt/live/
   sudo ls -la /etc/letsencrypt/archive/
   ```

⚠️ **Важные моменты:**
1. Сохраните резервную копию сертификатов
2. Настройте мониторинг срока действия сертификатов
3. Регулярно проверяйте оценку SSL Labs
4. Обновляйте конфигурацию nginx при изменении требований безопасности

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