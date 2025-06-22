require('dotenv').config();
const app = require('./src/app');
const { bot } = require('./src/bot');
const CronService = require('./src/services/cronService');
const checkDatabaseConnection = require('./check-db-connection');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

// Функция для запуска миграций
async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Проверка и запуск миграций базы данных...');

    // Читаем файл миграции
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Выполняем миграцию (если таблицы уже существуют - будет ошибка, но это нормально)
      await pool.query(migrationSQL);
      console.log('✅ Миграции успешно выполнены');
    } else {
      console.log('⚠️ Файл миграции не найден, пропускаем');
    }

  } catch (error) {
    // Если ошибка связана с тем, что таблицы уже существуют - это нормально
    if (error.code === '42P07') {
      console.log('ℹ️ Таблицы базы данных уже существуют');
    } else {
      console.error('❌ Ошибка выполнения миграций:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

async function startServer() {
  try {
    console.log('🚀 Запуск сервера Out Time...');

    // Проверяем обязательные переменные окружения
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'BOT_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Отсутствуют обязательные переменные окружения:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\n💡 Создайте файл .env с необходимыми переменными');
      process.exit(1);
    }

    // Проверяем подключение к базе данных
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ Не удается подключиться к базе данных');
      process.exit(1);
    }

    // Запускаем миграции базы данных
    await runMigrations();

    // Запускаем API сервер
    const server = app.listen(PORT, () => {
      console.log(`✅ API сервер запущен на порту ${PORT}`);
      console.log(`🌐 Swagger документация: http://localhost:${PORT}/api-docs`);
    });

    // Запускаем Telegram бота (пока отключен для тестирования)
    try {
      console.log('🤖 Запуск Telegram бота...');
      await bot.launch();
      console.log('✅ Telegram бот запущен');
    } catch (error) {
      console.log('⚠️ Ошибка запуска бота (продолжаем без бота):', error.message);
      console.log('💡 Проверьте BOT_TOKEN в .env файле');
    }

    // Инициализируем планировщик уведомлений
    CronService.init();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 Получен сигнал ${signal}, останавливаем сервер...`);

      bot.stop(signal);
      console.log('✅ Telegram бот остановлен');

      server.close(() => {
        console.log('✅ API сервер остановлен');
        console.log('👋 Сервер успешно завершен');
        process.exit(0);
      });
    };

    // Обработчики сигналов завершения
    process.once('SIGINT', gracefulShutdown);
    process.once('SIGTERM', gracefulShutdown);

    console.log('\n🎉 Система Out Time успешно запущена!');
    console.log('📊 Компоненты:');
    console.log('   ✅ API сервер (Express.js)');
    console.log('   ✅ Telegram бот');
    console.log('   ✅ Планировщик уведомлений');
    console.log('   ✅ База данных PostgreSQL');

    if (process.env.NODE_ENV === 'development') {
      console.log('\n🧪 Режим разработки активен');
      console.log('💡 Для тестирования используйте:');
      console.log('   - API: http://localhost:3000/api');
      console.log('   - Healthcheck: http://localhost:3000/health');
    }

  } catch (error) {
    console.error('❌ Критическая ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

// Обработчик необработанных исключений
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение Promise:', reason);
  console.error('Promise:', promise);
  // Не завершаем процесс, просто логируем
});

process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

// Запускаем сервер
startServer(); 