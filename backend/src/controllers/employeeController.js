const { body, validationResult } = require('express-validator');
const EmployeeService = require('../services/employeeService');

class EmployeeController {
  // Валидация для создания приглашения
  static validateInvite = [
    body('name')
      .isLength({ min: 2, max: 100 })
      .trim()
      .escape()
      .withMessage('Имя сотрудника должно содержать от 2 до 100 символов')
  ];

  static async createInvite(req, res) {
    try {
      // Проверка валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Ошибка валидации данных',
          details: errors.array()
        });
      }

      const { name } = req.body;
      const companyId = req.user.companyId;

      const result = await EmployeeService.createInvite(companyId, name);

      res.status(201).json({
        message: 'Пригласительная ссылка создана',
        inviteLink: result.inviteLink,
        invite: {
          id: result.invite.id,
          employeeName: result.invite.employee_name,
          token: result.invite.token,
          expiresAt: result.invite.expires_at,
          createdAt: result.invite.created_at
        }
      });

    } catch (error) {
      console.error('Ошибка создания приглашения:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при создании приглашения'
      });
    }
  }

  static async getEmployees(req, res) {
    try {
      const companyId = req.user.companyId;
      const employees = await EmployeeService.getEmployeesByCompany(companyId);

      res.json({
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          telegramId: emp.telegramId,
          isActive: emp.isActive,
          createdAt: emp.created_at,
          // Данные за сегодня
          todayStartTime: emp.todayStartTime,
          todayEndTime: emp.todayEndTime,
          todayStatus: emp.todayStatus,
          hasSubmittedReportToday: emp.hasSubmittedReportToday,
          todayReportContent: emp.todayReportContent,
          todayWorkDuration: emp.todayWorkDuration
        }))
      });

    } catch (error) {
      console.error('Ошибка получения списка сотрудников:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при получении списка сотрудников'
      });
    }
  }

  static async getEmployeeDetails(req, res) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (!employeeId) {
        return res.status(400).json({
          error: 'Неверный ID сотрудника'
        });
      }

      const details = await EmployeeService.getEmployeeDetails(employeeId);

      res.json({
        employee: {
          id: details.employee.id,
          name: details.employee.name,
          telegramId: details.employee.telegram_id,
          isActive: details.employee.is_active,
          createdAt: details.employee.created_at
        },
        today: {
          timeRecord: details.today.timeRecord ? {
            startTime: details.today.timeRecord.start_time,
            endTime: details.today.timeRecord.end_time,
            status: details.today.timeRecord.status,
            workDuration: details.today.timeRecord.start_time && details.today.timeRecord.end_time 
              ? EmployeeService.calculateWorkDuration(
                  details.today.timeRecord.start_time, 
                  details.today.timeRecord.end_time
                )
              : null
          } : null,
          report: details.today.report ? {
            content: details.today.report.content,
            createdAt: details.today.report.created_at
          } : null
        },
        weekStats: details.weekStats,
        recentReports: details.recentReports.map(report => ({
          id: report.id,
          date: report.date,
          content: report.content,
          createdAt: report.created_at
        }))
      });

    } catch (error) {
      console.error('Ошибка получения данных сотрудника:', error.message);

      if (error.message === 'Сотрудник не найден') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Ошибка сервера при получении данных сотрудника'
      });
    }
  }

  static async deactivateEmployee(req, res) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (!employeeId) {
        return res.status(400).json({
          error: 'Неверный ID сотрудника'
        });
      }

      const Employee = require('../models/Employee');
      const result = await Employee.deactivate(employeeId);

      if (!result) {
        return res.status(404).json({
          error: 'Сотрудник не найден'
        });
      }

      res.json({
        message: 'Сотрудник деактивирован',
        employee: {
          id: result.id,
          name: result.name,
          isActive: result.is_active
        }
      });

    } catch (error) {
      console.error('Ошибка деактивации сотрудника:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при деактивации сотрудника'
      });
    }
  }

  static async updateEmployee(req, res) {
    try {
      const employeeId = parseInt(req.params.id);
      const { name, isActive } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({
          error: 'Неверный ID сотрудника'
        });
      }

      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          error: 'Имя сотрудника должно содержать минимум 2 символа'
        });
      }

      const Employee = require('../models/Employee');
      const result = await Employee.update(employeeId, {
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true
      });

      if (!result) {
        return res.status(404).json({
          error: 'Сотрудник не найден'
        });
      }

      res.json({
        message: 'Данные сотрудника обновлены',
        employee: {
          id: result.id,
          name: result.name,
          isActive: result.is_active,
          updatedAt: result.updated_at
        }
      });

    } catch (error) {
      console.error('Ошибка обновления данных сотрудника:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при обновлении данных сотрудника'
      });
    }
  }
}

module.exports = EmployeeController; 