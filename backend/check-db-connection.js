require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabaseConnection() {
  console.log('🔍 Проверка подключения к базе данных...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не установлен');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000 // 10 секунд таймаут
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Подключение к базе данных успешно');
    console.log(`🕐 Время сервера БД: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('💡 Хост базы данных не найден. Проверьте:');
      console.error('   - Правильность DATABASE_URL');
      console.error('   - Доступность сервера базы данных');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Соединение отклонено. Проверьте:');
      console.error('   - Запущен ли сервер PostgreSQL');
      console.error('   - Правильность порта в DATABASE_URL');
    } else if (error.code === '28P01') {
      console.error('💡 Ошибка аутентификации. Проверьте:');
      console.error('   - Правильность логина и пароля в DATABASE_URL');
    }

    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Неожиданная ошибка:', error);
      process.exit(1);
    });
}

module.exports = checkDatabaseConnection; 