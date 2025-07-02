import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import sequelize from '../../src/config/database.js';
import { performance } from 'perf_hooks';

describe('Query Performance Tests', () => {
  let companyId;
  let employeeId;
  const uniqueTelegramId = Math.floor(Math.random() * 1000000000) + 1000000000; // Генерируем уникальный telegram_id

  beforeAll(async () => {
    await sequelize.authenticate();

    // Создаем тестовые данные
    const company = await sequelize.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      ['Test Company']
    );
    companyId = company.rows[0].id;

    const employee = await sequelize.query(
      'INSERT INTO employees (telegram_id, name, company_id) VALUES ($1, $2, $3) RETURNING id',
      [uniqueTelegramId, 'Test Employee', companyId]
    );
    employeeId = employee.rows[0].id;

    // Создаем тестовые записи времени и отчетов
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      promises.push(
        sequelize.query(
          'INSERT INTO time_records (employee_id, date, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
          [employeeId, dateStr, date, new Date(date.getTime() + 8 * 3600000), 'work']
        )
      );

      promises.push(
        sequelize.query(
          'INSERT INTO reports (employee_id, date, content) VALUES ($1, $2, $3)',
          [employeeId, dateStr, `Test report content ${i}`]
        )
      );
    }
    await Promise.all(promises);
  });

  afterAll(async () => {
    try {
      // Очищаем тестовые данные
      await sequelize.query('DELETE FROM reports WHERE employee_id = $1', [employeeId]);
      await sequelize.query('DELETE FROM time_records WHERE employee_id = $1', [employeeId]);
      await sequelize.query('DELETE FROM employees WHERE id = $1', [employeeId]);
      await sequelize.query('DELETE FROM companies WHERE id = $1', [companyId]);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    await sequelize.close();
  });

  // Функция для измерения времени выполнения запроса
  async function measureQueryTime(query, params = []) {
    const start = performance.now();
    await sequelize.query(query, params);
    return performance.now() - start;
  }

  // Функция для проверки использования индекса
  async function checkIndexUsage(query, params = []) {
    const explainQuery = `EXPLAIN ANALYZE ${query}`;
    const result = await sequelize.query(explainQuery, params);
    const planText = result.rows.map(row => row['QUERY PLAN']).join('\\n');
    return {
      usesIndex: planText.toLowerCase().includes('index'),
      planText
    };
  }

  describe('Time Records Queries', () => {
    it('should efficiently find records by date range', async () => {
      const query = `
        SELECT * FROM time_records 
        WHERE employee_id = $1 
        AND date BETWEEN $2 AND $3
      `;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { usesIndex, planText } = await checkIndexUsage(query, [employeeId, startDate, endDate]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for date range search:', planText);

      const executionTime = await measureQueryTime(query, [employeeId, startDate, endDate]);
      expect(executionTime).toBeLessThan(100); // Должно выполняться быстрее 100мс
    });

    it('should efficiently find late employees', async () => {
      const query = `
        SELECT tr.*, e.name 
        FROM time_records tr
        JOIN employees e ON tr.employee_id = e.id
        WHERE e.company_id = $1 
        AND tr.date = CURRENT_DATE 
        AND tr.status = 'work'
        AND tr.start_time::time > '09:00:00'
      `;

      const { usesIndex, planText } = await checkIndexUsage(query, [companyId]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for late employees:', planText);

      const executionTime = await measureQueryTime(query, [companyId]);
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('Reports Queries', () => {
    it('should efficiently find recent reports', async () => {
      const query = `
        SELECT r.*, e.name as employee_name
        FROM reports r
        JOIN employees e ON r.employee_id = e.id
        WHERE e.company_id = $1
        ORDER BY r.created_at DESC
        LIMIT 10
      `;

      const { usesIndex, planText } = await checkIndexUsage(query, [companyId]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for recent reports:', planText);

      const executionTime = await measureQueryTime(query, [companyId]);
      expect(executionTime).toBeLessThan(50);
    });

    it('should efficiently search reports by date range', async () => {
      const query = `
        SELECT r.*, e.name
        FROM reports r
        JOIN employees e ON r.employee_id = e.id
        WHERE e.company_id = $1
        AND r.date BETWEEN $2 AND $3
      `;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { usesIndex, planText } = await checkIndexUsage(query, [companyId, startDate, endDate]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for reports date range:', planText);

      const executionTime = await measureQueryTime(query, [companyId, startDate, endDate]);
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Employees Queries', () => {
    it('should efficiently find active employees', async () => {
      const query = `
        SELECT e.*, 
               tr.start_time, 
               tr.end_time, 
               tr.status
        FROM employees e
        LEFT JOIN time_records tr ON e.id = tr.employee_id 
          AND tr.date = CURRENT_DATE
        WHERE e.company_id = $1 
        AND e.is_active = true
      `;

      const { usesIndex, planText } = await checkIndexUsage(query, [companyId]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for active employees:', planText);

      const executionTime = await measureQueryTime(query, [companyId]);
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('Company Statistics', () => {
    it('should efficiently calculate company statistics', async () => {
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
              ELSE NULL 
            END as work_hours
          FROM employees e
          LEFT JOIN time_records tr ON e.id = tr.employee_id 
            AND tr.date = CURRENT_DATE
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

      const { usesIndex, planText } = await checkIndexUsage(query, [companyId]);
      expect(usesIndex).toBe(true);
      console.log('Query plan for company statistics:', planText);

      const executionTime = await measureQueryTime(query, [companyId]);
      expect(executionTime).toBeLessThan(100);
    });
  });
}); 