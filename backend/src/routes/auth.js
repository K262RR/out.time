import express from 'express';
import rateLimit from 'express-rate-limit';
import * as AuthController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/authValidator.js';
import logger from '../config/logger.js';

const router = express.Router();

// Ограничитель для эндпоинта входа
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 запросов
  message: 'Слишком много попыток входа с этого IP, попробуйте снова через 15 минут.',
  standardHeaders: true, // Возвращать информацию о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключить заголовки `X-RateLimit-*`
  keyGenerator: (req, res) => req.ip, // Используем IP пользователя
  handler: (req, res, next, options) => {
    // Логируем событие превышения лимита
    logger.warn(`Rate limit exceeded for login attempt from IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
  trustProxy: 1 // Доверяем первому прокси (например, nginx)
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация новой компании
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - companyName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email администратора
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Пароль (минимум 8 символов)
 *               companyName:
 *                 type: string
 *                 description: Название компании
 *     responses:
 *       200:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Ошибка валидации или email уже существует
 */
router.post('/register', 
  registerSchema,
  validate,
  AuthController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация администратора
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Неверные учетные данные
 *       429:
 *         description: Слишком много запросов
 */
router.post('/login', 
  loginLimiter,
  loginSchema, 
  validate,
  AuthController.login
);

// Обновление токена (НЕ требует авторизации, так как access токен может быть истекшим)
router.post('/refresh', 
  AuthController.refreshToken
);

// Смена пароля (требует авторизации)
router.post('/change-password', 
  authenticateToken, 
  changePasswordSchema,
  validate,
  AuthController.changePassword
);

// Выход из системы
router.post('/logout', 
  AuthController.logout
);

// Выход со всех устройств
router.post('/logout-all', 
  authenticateToken, 
  AuthController.logoutAllDevices
);

// Получение активных сессий
router.get('/sessions', 
  authenticateToken, 
  AuthController.getActiveSessions
);

// Отзыв конкретной сессии
router.delete('/sessions/:sessionId', 
  authenticateToken, 
  AuthController.revokeSession
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение информации о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Не авторизован
 */
router.get('/me', 
  authenticateToken, 
  AuthController.me
);

export default router; 