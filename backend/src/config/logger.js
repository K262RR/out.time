import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = path.join(__dirname, '../../logs');
const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} ${level}: ${message}`;
  if (Object.keys(metadata).length) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

const developmentTransports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      align(),
      logFormat
    ),
  }),
];

const productionTransports = [
  new DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: process.env.NODE_ENV === 'development'
    ? developmentTransports
    : productionTransports,
  exitOnError: false, 
});

// Если не в продакшене, также выводим в консоль (для prod)
if (process.env.NODE_ENV !== 'development') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

export default logger; 