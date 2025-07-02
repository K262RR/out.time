import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Создаем пул подключений к базе данных
const pool = new Pool({
    connectionString: 'postgresql://postgres:mAPMRzeOTWhoKPOX@db.eokcyeyucknztfzrrwmc.supabase.co:6543/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log('🚀 Запуск миграций...');
    const client = await pool.connect();
    
    try {
        // Читаем все SQL файлы из директории
        const files = await fs.readdir(__dirname);
        const sqlFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort(); // Сортируем файлы по имени

        // Применяем каждый файл миграции
        for (const file of sqlFiles) {
            console.log(`📦 Применение миграции: ${file}`);
            const filePath = path.join(__dirname, file);
            const sql = await fs.readFile(filePath, 'utf-8');

            try {
                await client.query('BEGIN');
                
                // Разделяем SQL на отдельные команды
                const commands = sql.split(';')
                    .map(cmd => cmd.trim())
                    .filter(cmd => cmd.length > 0);
                
                // Выполняем каждую команду отдельно
                for (const command of commands) {
                    if (command.trim()) {
                        try {
                            await client.query(command);
                            console.log(`  ✓ Выполнена команда`);
                        } catch (err) {
                            // Игнорируем ошибки "уже существует"
                            if (err.code === '42P07' || // relation already exists
                                err.code === '42P16' || // index already exists
                                err.code === '42710')   // duplicate object
                            {
                                console.log(`  ⚠️ Объект уже существует: ${err.message}`);
                                continue;
                            }
                            throw err;
                        }
                    }
                }
                
                await client.query('COMMIT');
                console.log(`✅ Миграция ${file} успешно применена`);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`❌ Ошибка при применении миграции ${file}:`, error.message);
                throw error;
            }
        }

        console.log('✨ Все миграции успешно применены');
    } catch (error) {
        console.error('❌ Ошибка при выполнении миграций:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Запускаем миграции
migrate(); 