import express from 'express';
import * as DashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Основные данные для главной панели
router.get('/', DashboardController.getDashboardData);

// Статистика за неделю
router.get('/weekly', DashboardController.getWeeklyStats);

// Быстрые действия и уведомления
router.get('/quick-actions', DashboardController.getQuickActions);

// Уведомления
router.get('/notifications', DashboardController.getNotifications);

export default router; 