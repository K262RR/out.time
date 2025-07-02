const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

describe('Table Partitioning Tests', () => {
  let companyId;
  let employeeId;
  const uniqueTelegramId = Math.floor(Math.random() * 1000000000) + 1000000000;

  beforeAll(async () => {
    // Создаем тестовые данные
    const company = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      ['Test Company']
    );
    companyId = company.rows[0].id;

    const employee = await pool.query(
      'INSERT INTO employees (telegram_id, name, company_id) VALUES ($1, $2, $3) RETURNING id',
      [uniqueTelegramId, 'Test Employee', companyId]
    );
    employeeId = employee.rows[0].id;
  });

  afterAll(async () => {
    try {
      // Очищаем тестовые данные
      await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
      await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  describe('Partition Creation', () => {
    it('should create partitions for time_records', async () => {
      const result = await pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'time_records_p%'
      `);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should create partitions for reports', async () => {
      const result = await pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'reports_p%'
      `);
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Data Distribution', () => {
    beforeEach(async () => {
      // Очищаем данные перед каждым тестом
      await pool.query('DELETE FROM time_records WHERE employee_id = $1', [employeeId]);
      await pool.query('DELETE FROM reports WHERE employee_id = $1', [employeeId]);
    });

    it('should distribute time records across partitions', async () => {
      // Создаем записи за разные месяцы
      const dates = [
        new Date(),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // месяц назад
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)   // месяц вперед
      ];

      for (const date of dates) {
        await pool.query(
          'INSERT INTO time_records (employee_id, date, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
          [employeeId, date, date, new Date(date.getTime() + 8 * 3600000), 'work']
        );
      }

      // Проверяем распределение по партициям
      for (const date of dates) {
        const partitionName = 'time_records_p' + date.toISOString().slice(0, 7).replace('-', '_');
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [partitionName]);
        expect(result.rows[0].exists).toBe(true);

        const dataResult = await pool.query(`
          SELECT COUNT(*) 
          FROM time_records 
          WHERE employee_id = $1 
          AND date = $2::date
        `, [employeeId, date]);
        expect(parseInt(dataResult.rows[0].count)).toBe(1);
      }
    });

    it('should distribute reports across partitions', async () => {
      // Создаем отчеты за разные месяцы
      const dates = [
        new Date(),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // месяц назад
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)   // месяц вперед
      ];

      for (const date of dates) {
        await pool.query(
          'INSERT INTO reports (employee_id, date, content) VALUES ($1, $2, $3)',
          [employeeId, date, 'Test report']
        );
      }

      // Проверяем распределение по партициям
      for (const date of dates) {
        const partitionName = 'reports_p' + date.toISOString().slice(0, 7).replace('-', '_');
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [partitionName]);
        expect(result.rows[0].exists).toBe(true);

        const dataResult = await pool.query(`
          SELECT COUNT(*) 
          FROM reports 
          WHERE employee_id = $1 
          AND date = $2::date
        `, [employeeId, date]);
        expect(parseInt(dataResult.rows[0].count)).toBe(1);
      }
    });
  });

  describe('Query Performance', () => {
    beforeAll(async () => {
      // Создаем тестовые данные за разные периоды
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        promises.push(
          pool.query(
            'INSERT INTO time_records (employee_id, date, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
            [employeeId, date, date, new Date(date.getTime() + 8 * 3600000), 'work']
          )
        );
        promises.push(
          pool.query(
            'INSERT INTO reports (employee_id, date, content) VALUES ($1, $2, $3)',
            [employeeId, date, `Test report ${i}`]
          )
        );
      }
      await Promise.all(promises);
    });

    it('should efficiently query time records by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const start = process.hrtime();
      
      await pool.query(`
        SELECT * 
        FROM time_records 
        WHERE employee_id = $1 
        AND date BETWEEN $2 AND $3
      `, [employeeId, startDate, endDate]);

      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      expect(milliseconds).toBeLessThan(100);
    });

    it('should efficiently query reports by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const start = process.hrtime();
      
      await pool.query(`
        SELECT * 
        FROM reports 
        WHERE employee_id = $1 
        AND date BETWEEN $2 AND $3
      `, [employeeId, startDate, endDate]);

      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      expect(milliseconds).toBeLessThan(100);
    });
  });

  describe('Maintenance Functions', () => {
    it('should automatically create new partitions', async () => {
      await pool.query('SELECT create_new_partitions()');
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 6);
      const partitionName = 'time_records_p' + nextMonth.toISOString().slice(0, 7).replace('-', '_');
      
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [partitionName]);
      
      expect(result.rows[0].exists).toBe(true);
    });
  });
}); 