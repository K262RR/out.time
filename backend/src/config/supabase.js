import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.SUPABASE_URL || 'https://eokcyeyucknztfzrrwmc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVva2N5ZXl1Y2tuenRmenJyd21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5NTQxNjAsImV4cCI6MjAyNTUzMDE2MH0.mCGkQpF-kNBkO5ZEhNc1Na8m5nGqp8kO-MaGpj4lDhE';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '***' + supabaseKey.slice(-4) : 'не установлен');

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для проверки подключения
async function testConnection() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        console.log('✅ Подключение к Supabase успешно установлено');
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к Supabase:', error.message);
        return false;
    }
}

export {
    supabase,
    testConnection
}; 