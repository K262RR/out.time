import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { createBackup, restoreBackup, cleanOldBackups } from '../../scripts/backup.js';

jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => callback(null, { stdout: 'success' }))
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Database Backup Script', () => {
  const backupDir = path.join(__dirname, '../../backups');
  const testBackupPath = path.join(backupDir, 'test-backup.backup');

  beforeAll(() => {
    // Создаем директорию для бэкапов если не существует
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PGDATABASE = 'test_db';
    process.env.PGUSER = 'test_user';
    process.env.PGPASSWORD = 'test_password';
  });

  afterEach(() => {
    // Очищаем тестовые файлы
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
      if (file.startsWith('test-') || file.startsWith('backup-')) {
        fs.unlinkSync(path.join(backupDir, file));
      }
    });
  });

  it('should create a backup successfully', async () => {
    await createBackup(true);
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(f => f.startsWith('backup-'));
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  it('should fail to create backup without required env variables', async () => {
    delete process.env.PGDATABASE;
    await expect(createBackup()).rejects.toThrow('Отсутствуют необходимые переменные окружения');
  });

  it('should restore backup successfully', async () => {
    // Создаем тестовый файл бэкапа
    fs.writeFileSync(testBackupPath, 'test backup content');
    await restoreBackup(testBackupPath);
    expect(fs.existsSync(testBackupPath)).toBeTruthy();
  });

  it('should fail to restore non-existent backup', async () => {
    const nonExistentPath = path.join(backupDir, 'non-existent.backup');
    await expect(restoreBackup(nonExistentPath)).rejects.toThrow('Файл резервной копии не найден');
  });

  it('should clean old backups', async () => {
    // Создаем несколько тестовых бэкапов
    for (let i = 0; i < 35; i++) {
      const backupPath = path.join(backupDir, `backup-test-${i}.backup`);
      fs.writeFileSync(backupPath, `test backup ${i}`);
    }

    await cleanOldBackups();

    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(f => f.startsWith('backup-'));
    expect(backupFiles.length).toBeLessThanOrEqual(30); // maxBackups в конфиге
  });

  it('should handle compressed backups', async () => {
    // Создаем сжатый бэкап
    const compressedBackupPath = path.join(backupDir, 'test-backup.backup.gz');
    fs.writeFileSync(compressedBackupPath, 'compressed test backup content');
    
    await restoreBackup(compressedBackupPath);
    expect(fs.existsSync(compressedBackupPath)).toBeTruthy();
  });
}); 