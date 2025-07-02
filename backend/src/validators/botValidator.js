const { body, param } = require('express-validator');

const startDaySchema = [
  body('telegram_id')
    .exists().withMessage('Telegram ID обязателен')
    .isInt({ min: 1 }).withMessage('Telegram ID должен быть положительным числом')
    .toInt(),
  body('status')
    .exists().withMessage('Статус обязателен')
    .isIn(['work', 'late', 'sick', 'vacation', 'other']).withMessage('Недопустимый статус')
];

const endDaySchema = [
  body('telegram_id')
    .exists().withMessage('Telegram ID обязателен')
    .isInt({ min: 1 }).withMessage('Telegram ID должен быть положительным числом')
    .toInt(),
  body('report')
    .exists().withMessage('Отчет обязателен')
    .isString().withMessage('Отчет должен быть строкой')
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Отчет должен содержать от 10 до 2000 символов')
    .escape()
];

const validateInviteSchema = [
  param('token')
    .exists().withMessage('Токен обязателен')
    .isString().withMessage('Токен должен быть строкой')
    .trim()
    .isLength({ min: 32, max: 64 }).withMessage('Недопустимый формат токена')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Токен содержит недопустимые символы')
];

const updateSettingsSchema = [
  body('notification_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время должно быть в формате HH:MM'),
  body('timezone')
    .optional()
    .isString().withMessage('Часовой пояс должен быть строкой')
    .matches(/^[A-Za-z]+\/[A-Za-z_]+$/).withMessage('Недопустимый формат часового пояса')
];

module.exports = {
  startDaySchema,
  endDaySchema,
  validateInviteSchema,
  updateSettingsSchema,
}; 