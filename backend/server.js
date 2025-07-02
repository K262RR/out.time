import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import https from 'https';
import app from './src/app.js';
import { bot } from './src/bot.js';
import * as CronService from './src/services/cronService.js';
import logger from './src/config/logger.js';

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

async function startServer() {
  try {
    logger.info('🚀 Запуск сервера Out Time...');

    // Проверяем обязательные переменные окружения
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'BOT_TOKEN'];
    if (process.env.NODE_ENV === 'production') {
      requiredEnvVars.push('DOMAIN', 'SSL_CERT_PATH', 'SSL_KEY_PATH');
    }
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error('❌ Отсутствуют обязательные переменные окружения:');
      missingVars.forEach(varName => logger.error(`   - ${varName}`));
      logger.error('💡 Создайте файл .env с необходимыми переменными');
      process.exit(1);
    }

    let server;

    // В production используем HTTPS
    if (process.env.NODE_ENV === 'production') {
      try {
        const httpsOptions = {
          cert: fs.readFileSync(process.env.SSL_CERT_PATH),
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          ca: process.env.SSL_CHAIN_PATH ? fs.readFileSync(process.env.SSL_CHAIN_PATH) : undefined
        };

        // Создаем HTTPS сервер
        server = https.createServer(httpsOptions, app);
        
        // Запускаем HTTPS сервер
        server.listen(HTTPS_PORT, () => {
          logger.info(`✅ HTTPS сервер запущен на порту ${HTTPS_PORT}`);
          logger.info(`🔒 SSL/TLS активирован`);
        });

        // Создаем HTTP сервер для редиректа на HTTPS
        const httpServer = http.createServer((req, res) => {
          res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
          res.end();
        });

        httpServer.listen(PORT, () => {
          logger.info(`✅ HTTP->HTTPS редирект настроен на порту ${PORT}`);
        });

      } catch (error) {
        logger.error('❌ Ошибка при настройке HTTPS:', { error });
        process.exit(1);
      }
    } else {
      // В development используем HTTP
      server = app.listen(PORT, () => {
        logger.info(`✅ HTTP сервер запущен на порту ${PORT}`);
        logger.info(`🌐 Swagger документация: http://localhost:${PORT}/api-docs`);
      });
    }

    // Запускаем Telegram бота
    try {
      logger.info('🤖 Запуск Telegram бота...');
      await bot.launch();
      logger.info('✅ Telegram бот запущен');
    } catch (error) {
      logger.warn('⚠️ Ошибка запуска бота (продолжаем без бота):', { message: error.message });
      logger.warn('💡 Проверьте BOT_TOKEN в .env файле');
    }

    // Инициализируем планировщик уведомлений
    CronService.init();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n📡 Получен сигнал ${signal}, останавливаем сервер...`);
      
      bot.stop(signal);
      logger.info('✅ Telegram бот остановлен');
      
      server.close(() => {
        logger.info('✅ Сервер остановлен');
        logger.info('👋 Сервер успешно завершен');
        process.exit(0);
      });
    };

    // Обработчики сигналов завершения
    process.once('SIGINT', gracefulShutdown);
    process.once('SIGTERM', gracefulShutdown);

    logger.info('🎉 Система Out Time успешно запущена!');
    logger.info('📊 Компоненты:');
    logger.info(`   ✅ ${process.env.NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'} сервер`);
    logger.info('   ✅ Telegram бот');
    logger.info('   ✅ Планировщик уведомлений');
    logger.info('   ✅ База данных PostgreSQL');
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('🧪 Режим разработки активен');
      logger.info('💡 Для тестирования используйте:');
      logger.info('   - API: http://localhost:3000/api');
      logger.info('   - Healthcheck: http://localhost:3000/health');
    } else {
      logger.info('🚀 Production режим активен');
      logger.info('   - SSL/TLS: Активен');
      logger.info('   - HTTPS редирект: Активен');
      logger.info('   - HSTS: Активен');
    }

  } catch (error) {
    logger.error('❌ Критическая ошибка при запуске сервера:', { error });
    process.exit(1);
  }
}

// Обработчик необработанных исключений
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Необработанное отклонение Promise:', { reason, promise });
  // Не завершаем процесс, просто логируем
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Необработанное исключение:', { error });
  process.exit(1);
});

// Запускаем сервер
startServer(); 