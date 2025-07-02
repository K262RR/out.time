const { body } = require('express-validator');

const registerSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('companyName')
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Название компании должно содержать от 2 до 100 символов'),
];

const loginSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен'),
];

const changePasswordSchema = [
    body('currentPassword').notEmpty().withMessage('Текущий пароль обязателен'),
    body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов'),
];


module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
}; 