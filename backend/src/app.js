require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Middleware для безопасности
app.use(helmet());

// CORS настройки
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL
].filter(Boolean);

// Добавляем поддержку всех Vercel доменов
const isVercelDomain = (origin) => {
  return origin && (
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.vercel.com')
  );
};

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);

    // Проверяем разрешенные origins или Vercel домены
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelDomain(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Не разрешено CORS политикой'));
    }
  },
  credentials: true
}));

// Парсинг body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Out Time API Documentation'
}));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'OutTime Backend'
  });
});

// Публичные API маршруты (без аутентификации)
app.use('/api/public', require('./routes/public'));

// Защищенные API маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/settings', require('./routes/settings'));

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.originalUrl
  });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);

  // Ошибки валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации данных',
      details: err.message
    });
  }

  // Ошибки базы данных
  if (err.code === '23505') { // Duplicate key
    return res.status(400).json({
      error: 'Данные уже существуют'
    });
  }

  // Общая ошибка сервера
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
  });
});

module.exports = app; 