import Employee from '../models/Employee.js';
import Report from '../models/Report.js';
import TimeRecord from '../models/TimeRecord.js';
import { subDays, format } from 'date-fns';

class DashboardService {
  /**
   * Генерирует "виртуальные" уведомления на основе данных компании.
   * Оптимизированная версия с объединенными запросами.
   * @param {number} companyId - ID компании.
   * @returns {Promise<Array<object>>}
   */
  static async getNotifications(companyId) {
    const now = new Date();
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    try {
      // Получаем все необходимые данные одним запросом
      const [lateEmployees, employeesWithoutReport, newEmployees] = await Promise.all([
        TimeRecord.findLateToday(companyId),
        Report.findEmployeesWithoutReport(companyId, yesterday),
        Employee.findRecent(companyId, twentyFourHoursAgo)
      ]);

      const notifications = [];

      // 1. Опоздавшие сегодня
      lateEmployees.forEach(record => {
        notifications.push({
          id: `late-${record.employee_id}-${record.date}`,
          type: 'late',
          message: this.generateNotificationMessage('late', record.employee_name),
          employee: {
            id: record.employee_id,
            name: record.employee_name,
          },
          timestamp: new Date(record.start_time).toISOString(),
        });
      });

      // 2. Не сдавшие отчет вчера
      employeesWithoutReport.forEach(employee => {
        notifications.push({
          id: `no-report-${employee.id}-${yesterday}`,
          type: 'no_report',
          message: this.generateNotificationMessage('no_report', employee.name, yesterday),
          employee: {
            id: employee.id,
            name: employee.name,
          },
          timestamp: new Date(`${yesterday}T23:59:59`).toISOString(),
        });
      });

      // 3. Новые сотрудники
      newEmployees.forEach(employee => {
        notifications.push({
          id: `new-employee-${employee.id}`,
          type: 'new_employee',
          message: this.generateNotificationMessage('new_employee', employee.name),
          employee: {
            id: employee.id,
            name: employee.name,
          },
          timestamp: new Date(employee.created_at).toISOString(),
        });
      });

      // Сортируем по времени (сначала новые)
      return notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      return this.getNotificationsFallback(companyId);
    }
  }

  /**
   * Генерирует сообщение уведомления
   */
  static generateNotificationMessage(type, employeeName, yesterday) {
    switch (type) {
      case 'late':
        return `${employeeName} опоздал(а) сегодня.`;
      case 'no_report':
        return `${employeeName} не сдал(а) отчет за вчера.`;
      case 'new_employee':
        return `Новый сотрудник ${employeeName} присоединился к компании.`;
      default:
        return `Уведомление для ${employeeName}`;
    }
  }

  /**
   * Fallback метод с оригинальной логикой
   */
  static async getNotificationsFallback(companyId) {
    const notifications = [];
    const now = new Date();

    // 1. Опоздавшие сегодня
    const lateEmployees = await TimeRecord.findLateToday(companyId);
    lateEmployees.forEach(record => {
      notifications.push({
        id: `late-${record.employee_id}-${record.date}`,
        type: 'late',
        message: `${record.employee_name} опоздал(а) сегодня.`,
        employee: {
          id: record.employee_id,
          name: record.employee_name,
        },
        timestamp: new Date(record.start_time).toISOString(),
      });
    });

    // 2. Не сдавшие отчет вчера
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
    const employeesWithoutReport = await Report.findEmployeesWithoutReport(companyId, yesterday);
    employeesWithoutReport.forEach(employee => {
       notifications.push({
        id: `no-report-${employee.id}-${yesterday}`,
        type: 'no_report',
        message: `${employee.name} не сдал(а) отчет за вчера.`,
        employee: {
          id: employee.id,
          name: employee.name,
        },
        timestamp: new Date(`${yesterday}T23:59:59`).toISOString(),
      });
    });
    
    // 3. Новые сотрудники за последние 24 часа
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const newEmployees = await Employee.findRecent(companyId, twentyFourHoursAgo);
    newEmployees.forEach(employee => {
      notifications.push({
        id: `new-employee-${employee.id}`,
        type: 'new_employee',
        message: `Новый сотрудник ${employee.name} присоединился к компании.`,
        employee: {
          id: employee.id,
          name: employee.name,
        },
        timestamp: new Date(employee.created_at).toISOString(),
      });
    });

    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export default DashboardService; 