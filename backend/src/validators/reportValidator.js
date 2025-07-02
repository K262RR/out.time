const { query } = require('express-validator');

const getReportsSchema = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Дата начала должна быть в формате YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Дата окончания должна быть в формате YYYY-MM-DD'),
  query('employeeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID сотрудника должен быть целым положительным числом'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть целым положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть от 1 до 100'),
];

module.exports = {
  getReportsSchema,
}; 