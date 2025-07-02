const express = require('express');
const Employee = require('../models/Employee');
const TimeRecord = require('../models/TimeRecord');
const Report = require('../models/Report');
const validate = require('../middleware/validate');
const { employeeByTelegramIdSchema } = require('../validators/publicValidator');
const { Op } = require('sequelize');

const router = express.Router();

// Публичный маршрут для поиска сотрудника по Telegram ID
router.get('/employees/by-telegram/:telegramId', 
  employeeByTelegramIdSchema,
  validate,
  async (req, res) => {
    try {
      const { telegramId } = req.params;
      
      const employee = await Employee.findByTelegramId(telegramId);
      
      if (!employee) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
      }

      // Получаем текущую дату в UTC
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Получаем начало недели (понедельник) в UTC
      const weekStart = new Date(todayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + (weekStart.getUTCDay() === 0 ? -6 : 1));
      
      // Конец недели (воскресенье) в UTC
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);

      // Получаем записи времени за сегодня
      const todayRecords = await TimeRecord.findAll({
        where: {
          employee_id: employee.id,
          created_at: {
            [Op.between]: [todayStart, todayEnd]
          }
        },
        order: [['created_at', 'DESC']]
      });

      // Получаем отчеты за неделю
      const weekReports = await Report.findAll({
        where: {
          employee_id: employee.id,
          created_at: {
            [Op.between]: [weekStart, weekEnd]
          }
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        employee,
        today: {
          records: todayRecords,
          date: todayStart.toISOString().split('T')[0]
        },
        week: {
          reports: weekReports,
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Ошибка при получении данных сотрудника:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

module.exports = router; 