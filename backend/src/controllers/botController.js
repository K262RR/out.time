const EmployeeService = require('../services/employeeService');

class BotController {
  // Регистрация сотрудника через бота
  static async registerEmployee(req, res) {
    try {
      const { telegram_id, name, invite_token } = req.body;

      if (!telegram_id || !invite_token) {
        return res.status(400).json({
          error: 'Telegram ID и токен приглашения обязательны'
        });
      }

      const result = await EmployeeService.registerEmployee(
        telegram_id, 
        name, 
        invite_token
      );

      res.status(201).json({
        success: true,
        message: `Добро пожаловать в компанию ${result.companyName}!`,
        employee: {
          id: result.employee.id,
          name: result.employee.name,
          companyName: result.companyName
        }
      });

    } catch (error) {
      console.error('Ошибка регистрации сотрудника:', error.message);
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Отметка начала рабочего дня
  static async startWorkDay(req, res) {
    try {
      const { telegram_id, status = 'work' } = req.body;

      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Telegram ID обязателен'
        });
      }

      const result = await EmployeeService.recordStartTime(telegram_id, status);

      res.json({
        success: true,
        message: result.message,
        timeRecord: {
          startTime: result.timeRecord.start_time || new Date(),
          status: result.timeRecord.status
        }
      });

    } catch (error) {
      console.error('Ошибка отметки начала дня:', error.message);
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Отправка отчета и завершение дня
  static async endWorkDay(req, res) {
    try {
      const { telegram_id, content } = req.body;

      if (!telegram_id || !content) {
        return res.status(400).json({
          success: false,
          error: 'Telegram ID и содержимое отчета обязательны'
        });
      }

      if (content.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: 'Отчет должен содержать минимум 5 символов'
        });
      }

      const result = await EmployeeService.recordEndTimeAndReport(
        telegram_id, 
        content.trim()
      );

      res.json({
        success: true,
        message: result.message,
        report: {
          id: result.report.id,
          content: result.report.content,
          date: result.report.date
        },
        workDuration: result.workDuration
      });

    } catch (error) {
      console.error('Ошибка завершения дня:', error.message);
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение статуса сотрудника
  static async getEmployeeStatus(req, res) {
    try {
      const { telegram_id } = req.params;

      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Telegram ID обязателен'
        });
      }

      const Employee = require('../models/Employee');
      const TimeRecord = require('../models/TimeRecord');
      const Report = require('../models/Report');

      const employee = await Employee.findByTelegramId(telegram_id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Сотрудник не найден'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await TimeRecord.findByEmployeeAndDate(employee.id, today);
      const todayReport = await Report.findByEmployeeAndDate(employee.id, today);

      res.json({
        success: true,
        employee: {
          id: employee.id,
          name: employee.name,
          isActive: employee.is_active
        },
        today: {
          hasStarted: !!todayRecord?.start_time,
          hasEnded: !!todayRecord?.end_time,
          hasReport: !!todayReport,
          status: todayRecord?.status || 'not_started',
          startTime: todayRecord?.start_time,
          endTime: todayRecord?.end_time,
          workDuration: todayRecord?.start_time && todayRecord?.end_time
            ? EmployeeService.calculateWorkDuration(todayRecord.start_time, todayRecord.end_time)
            : null
        }
      });

    } catch (error) {
      console.error('Ошибка получения статуса:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при получении статуса'
      });
    }
  }

  // Валидация токена приглашения
  static async validateInvite(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Токен приглашения обязателен'
        });
      }

      const Invite = require('../models/Invite');
      const invite = await Invite.findValidByToken(token);

      if (!invite) {
        return res.status(404).json({
          success: false,
          error: 'Недействительная или истекшая ссылка приглашения'
        });
      }

      res.json({
        success: true,
        invite: {
          companyName: invite.company_name,
          employeeName: invite.employee_name,
          expiresAt: invite.expires_at
        }
      });

    } catch (error) {
      console.error('Ошибка валидации приглашения:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при валидации приглашения'
      });
    }
  }

  // Обновление настроек бота
  static async updateSettings(req, res) {
    try {
      const { telegram_id, settings } = req.body;

      if (!telegram_id || !settings) {
        return res.status(400).json({
          success: false,
          error: 'Telegram ID и настройки обязательны'
        });
      }

      const Employee = require('../models/Employee');
      const employee = await Employee.findByTelegramId(telegram_id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Сотрудник не найден'
        });
      }

      // Обновляем настройки
      await employee.updateSettings(settings);

      res.json({
        success: true,
        message: 'Настройки успешно обновлены',
        settings: employee.settings
      });

    } catch (error) {
      console.error('Ошибка обновления настроек:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при обновлении настроек'
      });
    }
  }
}

module.exports = BotController; 