const { body, param } = require('express-validator');

const createEmployeeSchema = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Имя сотрудника должно содержать от 2 до 100 символов'),
];

const updateEmployeeSchema = [
  param('id').isInt({ min: 1 }).withMessage('ID сотрудника должен быть целым положительным числом'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Имя сотрудника должно содержать от 2 до 100 символов'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Статус активности должен быть true или false'),
];

const employeeIdSchema = [
    param('id').isInt({ min: 1 }).withMessage('ID сотрудника должен быть целым положительным числом'),
];

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
}; 