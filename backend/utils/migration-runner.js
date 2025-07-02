const { Pool } = require('pg');
const SqlParser = require('./sql-parser');
require('dotenv').config();

class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.parser = new SqlParser();
  }

  /**
   * Выполняет SQL команду с обработкой ошибок
   * @param {string} command - SQL команда
   * @returns {Promise<void>}
   */
  async executeCommand(command) {
    try {
      await this.pool.query(command);
    } catch (error) {
      console.error('Error executing command:', error);
      console.error('Failed command:', command);
      throw error;
    }
  }

  /**
   * Выполняет миграцию из файла
   * @param {string} filePath - путь к файлу миграции
   * @returns {Promise<void>}
   */
  async runMigration(filePath) {
    console.log(`Running migration from ${filePath}`);
    
    const commands = this.parser.parseFile(filePath);
    
    // Начинаем транзакцию
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const command of commands) {
        if (command.trim()) {
          console.log('Executing command:', command.slice(0, 100) + '...');
          await client.query(command);
        }
      }
      
      await client.query('COMMIT');
      console.log('Migration completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Закрывает соединение с базой данных
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = MigrationRunner; 