import 'dotenv/config';
import { testConnection } from './src/config/supabase.js';

console.log('🔍 Проверка подключения к Supabase...');
console.log('URL:', process.env.SUPABASE_URL);

testConnection()
    .then(success => {
        if (success) {
            console.log('✨ Все настройки корректны');
            process.exit(0);
        } else {
            console.error('❌ Проверьте настройки подключения');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Ошибка при тестировании:', error);
        process.exit(1);
    }); 