const express = require('express');
const rateLimit = require('express-rate-limit');
const BotController = require('../controllers/botController');
const logger = require('../config/logger');
const validate = require('../middleware/validate');
const { startDaySchema, endDaySchema, validateInviteSchema, updateSettingsSchema } = require('../validators/botValidator');

const router = express.Router();

// Ограничитель для API бота
const botLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 секунд
  max: 5, // 5 запросов
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Используем ID телеграм пользователя из тела или параметров запроса,
    // если его нет - то IP адрес
    return req.body?.telegram_id || req.params?.telegram_id || req.ip;
  },
  handler: (req, res, next, options) => {
    const key = req.body?.telegram_id || req.params?.telegram_id || req.ip;
    logger.warn(`Rate limit exceeded for bot API from: ${key}`);
    // Отправляем ошибку в формате JSON, а не текст
    res.status(options.statusCode).json({
      success: false,
      error: 'Слишком много запросов, пожалуйста, подождите.'
    });
  },
});

// Применяем ограничитель ко всем роутам бота
router.use(botLimiter);

// Регистрация сотрудника через бота
router.post('/register', BotController.registerEmployee);

// Начало рабочего дня
router.post('/start-day', 
  startDaySchema,
  validate,
  BotController.startWorkDay
);

// Конец рабочего дня
router.post('/end-day', 
  endDaySchema,
  validate,
  BotController.endWorkDay
);

// Получение статуса сотрудника
router.get('/status/:telegram_id', BotController.getEmployeeStatus);

// Валидация токена приглашения
router.get('/validate-invite/:token', 
  validateInviteSchema,
  validate,
  BotController.validateInvite
);

// Обновление настроек бота
router.put('/settings', 
  updateSettingsSchema,
  validate,
  BotController.updateSettings
);

module.exports = router; 