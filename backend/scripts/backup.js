import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import logger from '../src/config/logger.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const config = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 30, // Хранить бэкапы за последние 30 дней
  compressBackups: true
};

// Создание директории для бэкапов если не существует
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

/**
 * Создает резервную копию базы данных
 * @param {boolean} [isManual=false] - Флаг ручного запуска
 */
async function createBackup(isManual = false) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(config.backupDir, `backup-${timestamp}`);
    
    // Получаем параметры подключения из переменных окружения
    const {
      PGHOST = 'localhost',
      PGPORT = 5432,
      PGDATABASE,
      PGUSER,
      PGPASSWORD
    } = process.env;

    if (!PGDATABASE || !PGUSER || !PGPASSWORD) {
      throw new Error('Отсутствуют необходимые переменные окружения для подключения к БД');
    }

    // Формируем команду для pg_dump
    const dumpCmd = `PGPASSWORD=${PGPASSWORD} pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -F c -b -v -f ${backupPath}.backup`;
    
    logger.info('Начало создания резервной копии...');
    await execAsync(dumpCmd);
    
    if (config.compressBackups) {
      await execAsync(`gzip ${backupPath}.backup`);
      logger.info(`Резервная копия создана и сжата: ${backupPath}.backup.gz`);
    } else {
      logger.info(`Резервная копия создана: ${backupPath}.backup`);
    }

    // Очистка старых бэкапов
    await cleanOldBackups();

    if (isManual) {
      logger.info('Ручное резервное копирование завершено успешно');
    }
  } catch (error) {
    logger.error('Ошибка при создании резервной копии:', error);
    throw error;
  }
}

/**
 * Восстанавливает базу данных из резервной копии
 * @param {string} backupPath - Путь к файлу резервной копии
 */
async function restoreBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Файл резервной копии не найден: ${backupPath}`);
    }

    const {
      PGHOST = 'localhost',
      PGPORT = 5432,
      PGDATABASE,
      PGUSER,
      PGPASSWORD
    } = process.env;

    if (!PGDATABASE || !PGUSER || !PGPASSWORD) {
      throw new Error('Отсутствуют необходимые переменные окружения для подключения к БД');
    }

    // Распаковка если файл сжат
    if (backupPath.endsWith('.gz')) {
      await execAsync(`gunzip -k ${backupPath}`);
      backupPath = backupPath.slice(0, -3);
    }

    // Восстановление базы данных
    const restoreCmd = `PGPASSWORD=${PGPASSWORD} pg_restore -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -v -c ${backupPath}`;
    
    logger.info('Начало восстановления базы данных...');
    await execAsync(restoreCmd);
    logger.info('База данных успешно восстановлена');
  } catch (error) {
    logger.error('Ошибка при восстановлении базы данных:', error);
    throw error;
  }
}

/**
 * Очищает старые резервные копии
 */
async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(config.backupDir);
    const backupFiles = files.filter(f => f.startsWith('backup-'));
    
    if (backupFiles.length <= config.maxBackups) return;

    // Сортируем файлы по дате создания (от старых к новым)
    const sortedFiles = backupFiles
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(config.backupDir, f)).birthtime
      }))
      .sort((a, b) => a.time - b.time);

    // Удаляем старые файлы
    const filesToDelete = sortedFiles.slice(0, sortedFiles.length - config.maxBackups);
    for (const file of filesToDelete) {
      fs.unlinkSync(path.join(config.backupDir, file.name));
      logger.info(`Удален старый бэкап: ${file.name}`);
    }
  } catch (error) {
    logger.error('Ошибка при очистке старых бэкапов:', error);
  }
}

// Если скрипт запущен напрямую
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const command = args[0];
  const backupPath = args[1];

  switch (command) {
    case 'create':
      createBackup(true)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'restore':
      if (!backupPath) {
        console.error('Необходимо указать путь к файлу резервной копии');
        process.exit(1);
      }
      restoreBackup(backupPath)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.error('Неизвестная команда. Используйте: create или restore <путь>');
      process.exit(1);
  }
}

export {
  createBackup,
  restoreBackup,
  cleanOldBackups
}; 