require('dotenv').config();
const app = require('./src/app');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

// Простая функция для запуска миграций
async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL не установлен, пропускаем миграции');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Запуск миграций базы данных...');

    // Проверяем подключение
    await pool.query('SELECT 1');
    console.log('✅ Подключение к базе данных успешно');

    // Читаем и выполняем миграцию
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migrationSQL);
      console.log('✅ Миграции выполнены');
    }

  } catch (error) {
    if (error.code === '42P07') {
      console.log('ℹ️ Таблицы уже существуют');
    } else {
      console.log('⚠️ Ошибка миграций (продолжаем):', error.message);
    }
  } finally {
    await pool.end();
  }
}

async function startServer() {
  try {
    console.log('🚀 Запуск сервера Out Time...');

    // Запускаем миграции (не критично если не получится)
    try {
      await runMigrations();
    } catch (error) {
      console.log('⚠️ Ошибка миграций, продолжаем без них:', error.message);
    }

    // Запускаем API сервер
    const server = app.listen(PORT, () => {
      console.log(`✅ API сервер запущен на порту ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });

    // Инициализируем бота только если есть токен
    if (process.env.BOT_TOKEN) {
      try {
        const { bot } = require('./src/bot');
        await bot.launch();
        console.log('✅ Telegram бот запущен');

        // Graceful shutdown для бота
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
      } catch (error) {
        console.log('⚠️ Ошибка бота (продолжаем без него):', error.message);
      }
    }

    // Инициализируем cron если доступен
    try {
      const CronService = require('./src/services/cronService');
      CronService.init();
      console.log('✅ Планировщик уведомлений запущен');
    } catch (error) {
      console.log('⚠️ Ошибка планировщика:', error.message);
    }

    console.log('🎉 Сервер успешно запущен!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Обработчик ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение Promise:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

// Запускаем сервер
startServer(); 