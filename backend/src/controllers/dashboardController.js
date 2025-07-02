import TimeRecord from '../models/TimeRecord.js';
import Report from '../models/Report.js';
import Employee from '../models/Employee.js';
import * as DashboardService from '../services/dashboardService.js';

class DashboardController {
  static async getDashboardData(req, res) {
    try {
      const companyId = req.user.companyId;
      const today = new Date().toISOString().split('T')[0];

      // Получаем статистику за сегодня
      const todayStats = await TimeRecord.getCompanyStats(companyId, today);
      
      // Получаем количество отчетов за сегодня
      const reportsToday = await Report.countByCompanyAndDate(companyId, today);
      
      // Получаем последние отчеты
      const recentReports = await Report.getRecentByCompany(companyId, 5);

      // Получаем общее количество активных сотрудников
      const allEmployees = await Employee.findByCompanyWithStats(companyId);

      // Форматируем данные
      const dashboardData = {
        todayStats: {
          totalEmployees: parseInt(todayStats.total_employees) || 0,
          workingToday: parseInt(todayStats.working_today) || 0,
          sickToday: parseInt(todayStats.sick_today) || 0,
          vacationToday: parseInt(todayStats.vacation_today) || 0,
          reportsToday: reportsToday,
          averageWorkHours: todayStats.avg_work_hours 
            ? parseFloat(todayStats.avg_work_hours).toFixed(1) 
            : '0.0'
        },
        recentReports: recentReports.map(report => ({
          id: report.id,
          employeeName: report.employee_name,
          content: report.content.length > 100 
            ? report.content.substring(0, 100) + '...' 
            : report.content,
          date: report.date,
          createdAt: report.created_at
        })),
        employeeStats: allEmployees.map(emp => ({
          id: emp.id,
          name: emp.name,
          totalDaysWorked: parseInt(emp.total_days_worked) || 0,
          totalReports: parseInt(emp.total_reports) || 0,
          avgHoursPerDay: emp.avg_hours_per_day 
            ? parseFloat(emp.avg_hours_per_day).toFixed(1) 
            : '0.0',
          joinedAt: emp.created_at
        }))
      };

      res.json(dashboardData);

    } catch (error) {
      console.error('Ошибка получения данных dashboard:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при получении данных панели'
      });
    }
  }

  static async getWeeklyStats(req, res) {
    try {
      const companyId = req.user.companyId;
      
      // Получаем данные за последние 7 дней
      const weeklyData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayStats = await TimeRecord.getCompanyStats(companyId, dateStr);
        const reportsCount = await Report.countByCompanyAndDate(companyId, dateStr);
        
        weeklyData.push({
          date: dateStr,
          dayName: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
          workingEmployees: parseInt(dayStats.working_today) || 0,
          reportsCount: reportsCount,
          avgWorkHours: dayStats.avg_work_hours 
            ? parseFloat(dayStats.avg_work_hours).toFixed(1) 
            : '0.0'
        });
      }

      res.json({
        weeklyStats: weeklyData,
        summary: {
          totalWorkingDays: weeklyData.filter(day => day.workingEmployees > 0).length,
          avgEmployeesPerDay: (weeklyData.reduce((sum, day) => sum + day.workingEmployees, 0) / 7).toFixed(1),
          avgReportsPerDay: (weeklyData.reduce((sum, day) => sum + day.reportsCount, 0) / 7).toFixed(1),
          avgHoursPerDay: (weeklyData.reduce((sum, day) => sum + parseFloat(day.avgWorkHours), 0) / 7).toFixed(1)
        }
      });

    } catch (error) {
      console.error('Ошибка получения недельной статистики:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при получении недельной статистики'
      });
    }
  }

  static async getQuickActions(req, res) {
    try {
      const companyId = req.user.companyId;
      
      // Получаем количество активных приглашений
      const Invite = require('../models/Invite');
      const activeInvites = await Invite.findActiveByCompany(companyId);
      
      // Получаем сотрудников без отчетов сегодня
      const today = new Date().toISOString().split('T')[0];
      const employees = await Employee.findByCompany(companyId);
      const employeesWithoutReports = employees.filter(emp => !emp.today_report);

      res.json({
        quickActions: {
          activeInvites: activeInvites.length,
          pendingReports: employeesWithoutReports.length,
          employeesWorkingToday: employees.filter(emp => emp.start_time).length,
          totalActiveEmployees: employees.filter(emp => emp.is_active).length
        },
        pendingReportEmployees: employeesWithoutReports.map(emp => ({
          id: emp.id,
          name: emp.name,
          startedWork: !!emp.start_time,
          startTime: emp.start_time
        }))
      });

    } catch (error) {
      console.error('Ошибка получения быстрых действий:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при получении быстрых действий'
      });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { companyId } = req.user;
      const notifications = await DashboardService.getNotifications(companyId);
      res.json(notifications);
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error.message);
      res.status(500).json({
        error: 'Ошибка сервера при получении уведомлений'
      });
    }
  }
}

export default DashboardController; 