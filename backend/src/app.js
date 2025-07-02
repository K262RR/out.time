import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import ApiError from './utils/ApiError.js';
import { apiLimiter, authLimiter, botLimiter, publicLimiter } from './middleware/rateLimiter.js';
import securityHeaders from './middleware/securityHeaders.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import botRoutes from './routes/bot.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// Применяем расширенные настройки безопасности
securityHeaders().forEach(middleware => app.use(middleware));

// Принудительный редирект на HTTPS в production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// CORS настройки
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace('http://', 'https://')
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено CORS политикой'));
    }
  },
  credentials: true
}));

// Rate limiting - применяется ко всем API запросам
app.use('/api', apiLimiter);

// Парсинг body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Out Time API Documentation'
}));

// Оптимизированное логирование запросов (только в dev режиме для консоли)
app.use((req, res, next) => {
  // Логируем только важные запросы, исключаем health check и статические файлы
  if (req.url !== '/health' && !req.url.startsWith('/api-docs')) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${req.ip}`);
    }
    // Structured logging для production
    logger.info(`${req.method} ${req.originalUrl}`, { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
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

// Публичные API маршруты (без аутентификации) - с ограниченным rate limiting
app.use('/api/public', publicLimiter, publicRoutes);

// Защищенные API маршруты
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bot', botLimiter, botRoutes);
app.use('/api/settings', settingsRoutes);

// Обработка 404
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.originalUrl 
  });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  let { statusCode, message } = err;
  
  // Если это не наша предвиденная ошибка, логируем ее как критическую
  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = 'Внутренняя ошибка сервера';
    logger.error('Unhandled Error', { 
      message: err.message, 
      stack: err.stack, 
      path: req.path,
      method: req.method
    });
  } else {
     logger.warn('Handled Error', { statusCode, message, path: req.path });
  }

  const response = {
    error: message,
    ...err.data,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode || 500).json(response);
});

export default app; 