const express = require('express');
const BotController = require('../controllers/botController');

const router = express.Router();

// Webhook для Telegram бота
router.post('/webhook', async (req, res) => {
  try {
    const { bot } = require('../bot');
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Регистрация сотрудника через бота
router.post('/register', BotController.registerEmployee);

// Отметка начала рабочего дня
router.post('/start-day', BotController.startWorkDay);

// Отправка отчета и завершение дня
router.post('/end-day', BotController.endWorkDay);

// Получение статуса сотрудника
router.get('/status/:telegram_id', BotController.getEmployeeStatus);

// Валидация токена приглашения
router.get('/validate-invite/:token', BotController.validateInvite);

module.exports = router; 