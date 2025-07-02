require('dotenv').config();
const pool = require('./src/config/database');
const CronService = require('./src/services/cronService');
const Employee = require('./src/models/Employee');
const TimeRecord = require('./src/models/TimeRecord');
const Report = require('./src/models/Report');

async function testNotifications() {
    const telegramId = process.argv[2];
    if (!telegramId) {
        console.error('❌ Укажите Telegram ID пользователя в аргументах');
        console.log('Пример: node test_notifications.js 123456789');
        process.exit(1);
    }

    console.log('🧪 Тестирование уведомлений...');
    console.log('📱 Telegram ID:', telegramId);

    try {
        // 1. Тестируем Telegram уведомления
        await CronService.testNotifications(telegramId);

        // 2. Создаем тестовые данные для веб-уведомлений
        const employee = await Employee.findByTelegramId(telegramId);
        if (!employee) {
            throw new Error('Сотрудник не найден');
        }

        const today = new Date().toISOString().split('T')[0];
        const companyId = employee.company_id;

        // 2.1 Создаем запись об опоздании
        const lateTime = new Date();
        lateTime.setHours(11, 0, 0); // Устанавливаем время на 11:00

        await TimeRecord.create({
            employee_id: employee.id,
            date: today,
            start_time: lateTime,
            status: 'late'
        });
        console.log('✅ Создана тестовая запись об опоздании');

        // 2.2 Пропускаем отчет за вчера
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Удаляем существующий отчет за вчера, если есть
        const deleteQuery = 'DELETE FROM reports WHERE employee_id = $1 AND date = $2';
        await pool.query(deleteQuery, [employee.id, yesterdayStr]);
        console.log('✅ Удален отчет за вчера (для теста отсутствия отчета)');

        // 2.3 Создаем нового тестового сотрудника через прямой SQL запрос
        const insertQuery = `
            INSERT INTO employees (name, telegram_id, company_id, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const newEmployee = await pool.query(insertQuery, [
            'Тестовый Сотрудник',
            '999999999',
            companyId,
            true
        ]);
        console.log('✅ Создан тестовый новый сотрудник');

        console.log('✅ Тест завершен');
        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error);
        process.exit(1);
    }
}

testNotifications(); 