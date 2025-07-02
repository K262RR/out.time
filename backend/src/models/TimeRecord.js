import sequelize from '../config/database.js';

class TimeRecord {
  static async create(data) {
    const query = `
      INSERT INTO time_records (employee_id, date, start_time, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.employeeId, data.date, data.startTime, data.status || 'work'];
    const [result] = await sequelize.query(query, { 
      bind: values,
      type: sequelize.QueryTypes.INSERT,
      raw: true
    });
    return result;
  }

  static async findByEmployeeAndDate(employeeId, date) {
    const query = 'SELECT * FROM time_records WHERE employee_id = $1 AND date = $2';
    const [result] = await sequelize.query(query, { 
      bind: [employeeId, date],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return result;
  }

  static async findByEmployeeAndDateRange(employeeId, startDate, endDate) {
    const query = `
      SELECT * FROM time_records 
      WHERE employee_id = $1 
      AND date >= $2
      AND date <= $3
      ORDER BY date DESC
    `;
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    
    const result = await sequelize.query(query, { 
      bind: [employeeId, start, end],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return result;
  }

  static async updateEndTime(employeeId, date, endTime) {
    const query = `
      UPDATE time_records 
      SET end_time = $3, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1 AND date = $2
      RETURNING *
    `;
    const [result] = await sequelize.query(query, { 
      bind: [employeeId, date, endTime],
      type: sequelize.QueryTypes.UPDATE,
      raw: true
    });
    return result;
  }

  static async updateStatus(employeeId, date, status) {
    const query = `
      UPDATE time_records 
      SET status = $3, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1 AND date = $2
      RETURNING *
    `;
    const [result] = await sequelize.query(query, { 
      bind: [employeeId, date, status],
      type: sequelize.QueryTypes.UPDATE,
      raw: true
    });
    return result;
  }

  static async findByCompanyAndDate(companyId, date) {
    const query = `
      SELECT tr.*, e.name as employee_name, e.telegram_id
      FROM time_records tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE e.company_id = $1 AND tr.date = $2
      ORDER BY e.name
    `;
    const result = await sequelize.query(query, { 
      bind: [companyId, date],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return result;
  }

  static async getCompanyStats(companyId, date) {
    // Оптимизированный запрос с использованием CTE и индексов
    const query = `
      WITH employee_stats AS (
        SELECT 
          e.id,
          tr.start_time,
          tr.end_time,
          tr.status,
          CASE 
            WHEN tr.start_time IS NOT NULL AND tr.end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (tr.end_time - tr.start_time))/3600 
            WHEN tr.start_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - tr.start_time))/3600
            ELSE NULL 
          END as work_hours
        FROM employees e
        LEFT JOIN time_records tr ON e.id = tr.employee_id AND tr.date = $2
        WHERE e.company_id = $1 AND e.is_active = true
      )
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN start_time IS NOT NULL THEN 1 END) as working_today,
        COUNT(CASE WHEN status = 'sick' THEN 1 END) as sick_today,
        COUNT(CASE WHEN status = 'vacation' THEN 1 END) as vacation_today,
        COALESCE(ROUND(AVG(work_hours)::numeric, 1), 0) as avg_work_hours
      FROM employee_stats
    `;
    const [result] = await sequelize.query(query, { 
      bind: [companyId, date],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return result;
  }

  static async findLateToday(companyId) {
    const query = `
      SELECT 
        tr.employee_id,
        tr.start_time,
        tr.date,
        e.name as employee_name
      FROM time_records tr
      JOIN employees e ON tr.employee_id = e.id
      JOIN companies c ON e.company_id = c.id
      WHERE e.company_id = $1
        AND tr.date = CURRENT_DATE
        AND tr.status = 'work'
        AND tr.start_time::time > c.morning_notification_time;
    `;
    const result = await sequelize.query(query, { 
      bind: [companyId],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return result;
  }
}

export default TimeRecord; 