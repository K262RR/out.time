const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://outcasts@localhost:5432/outtime',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Получаем список всех таблиц
    const { rows } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    // Удаляем каждую таблицу
    for (const row of rows) {
      const tableName = row.tablename;
      console.log(`Dropping table: ${tableName}`);
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    await client.query('COMMIT');
    console.log('Database cleaned successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cleaning database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase(); 