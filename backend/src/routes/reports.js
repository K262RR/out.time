const express = require('express');
const ReportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getReportsSchema } = require('../validators/reportValidator');
const { employeeIdSchema } = require('../validators/employeeValidator');
const { exportLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Получение списка отчетов с фильтрацией
router.get('/', getReportsSchema, validate, ReportController.getReports);

// Экспорт отчетов в Excel - с ограничением rate limiting
router.get('/export', exportLimiter, getReportsSchema, validate, ReportController.exportReports);

// Статистика по отчетам
router.get('/stats', getReportsSchema, validate, ReportController.getReportStats);

// Получение конкретного отчета
router.get('/:id', employeeIdSchema, validate, ReportController.getReport);

module.exports = router; 