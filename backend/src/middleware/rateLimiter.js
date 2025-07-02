import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

// Функция для логирования превышения лимитов
const rateLimitHandler = (req, res) => {
  const clientInfo = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  logger.warn('Rate limit exceeded', clientInfo);
  
  res.status(429).json({
    error: 'Слишком много запросов',
    message: 'Превышен лимит запросов. Попробуйте позже.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000)
  });
};

// Функция для пропуска rate limiting в тестовом окружении
const skipSuccessfulRequests = false; // Всегда показываем headers
const skipFailedRequests = false;

// Основной rate limiter для всех API запросов
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 запросов в production, 1000 в dev
  message: {
    error: 'Слишком много запросов',
    message: 'Превышен лимит запросов с данного IP адреса'
  },
  standardHeaders: true, // Возвращает rate limit info в headers `RateLimit-*`
  legacyHeaders: false, // Отключает `X-RateLimit-*` headers
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Используем комбинацию IP и User-Agent для более точной идентификации
    return `${req.ip}_${req.get('User-Agent')?.substring(0, 50) || 'unknown'}`;
  }
});

// Строгий rate limiter для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 попыток в production, 50 в dev
  message: {
    error: 'Слишком много попыток входа',
    message: 'Превышен лимит попыток аутентификации. Попробуйте через 15 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: skipSuccessfulRequests,
  skipFailedRequests: skipFailedRequests
});

// Rate limiter для bot API (более мягкий, так как боты могут быть активными)
const botLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // 30 запросов в минуту в production
  message: {
    error: 'Bot rate limit exceeded',
    message: 'Превышен лимит запросов для бота. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Для bot API используем telegram user_id если доступен
    const telegramUserId = req.body?.message?.from?.id || 
                          req.body?.callback_query?.from?.id ||
                          req.body?.from?.id;
    return telegramUserId ? `bot_${telegramUserId}` : `bot_${req.ip}`;
  }
});

// Rate limiter для публичных API (например, регистрация)
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 10 регистраций в час
  message: {
    error: 'Слишком много попыток регистрации',
    message: 'Превышен лимит регистраций с данного IP адреса'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: skipSuccessfulRequests
});

// Rate limiter для экспорта данных (ресурсоемкие операции)
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: process.env.NODE_ENV === 'production' ? 3 : 10, // 3 экспорта в 10 минут
  message: {
    error: 'Слишком много запросов на экспорт',
    message: 'Превышен лимит экспорта данных. Попробуйте через 10 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export {
  apiLimiter,
  authLimiter,
  botLimiter,
  publicLimiter,
  exportLimiter
}; 