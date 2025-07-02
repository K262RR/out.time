const { param } = require('express-validator');

const employeeByTelegramIdSchema = [
  param('telegramId')
    .exists().withMessage('Telegram ID обязателен')
    .isInt({ min: 1 }).withMessage('Telegram ID должен быть положительным числом')
    .toInt()
];

module.exports = {
  employeeByTelegramIdSchema,
}; 