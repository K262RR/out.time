import { Sequelize } from 'sequelize';
import logger from './logger.js';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: process.env.NODE_ENV === 'production' ? 25 : 10,
    min: process.env.NODE_ENV === 'production' ? 5 : 2,
    idle: 30000,
    acquire: 60000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    statement_timeout: 30000
  }
});

// Connection health check
sequelize.authenticate()
  .then(() => {
    logger.info('✅ Подключение к PostgreSQL установлено');
  })
  .catch((err) => {
    logger.error('❌ Ошибка подключения к PostgreSQL', { error: err.stack });
    process.exit(-1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Получен SIGINT, закрываем соединение с базой данных...');
  sequelize.close().then(() => {
    console.log('Соединение с базой данных закрыто');
    process.exit(0);
  });
});

export default sequelize; 