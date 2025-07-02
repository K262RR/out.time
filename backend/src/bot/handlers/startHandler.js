// Используем встроенный fetch или импортируем node-fetch
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

import statusHandler from './statusHandler.js';

async function startHandler(ctx) {
  try {
    const telegramId = ctx.from.id;
    const userName = ctx.from.first_name || 'Сотрудник';
    const startPayload = ctx.startPayload; // Токен приглашения

    // Если есть токен приглашения
    if (startPayload) {
      try {
        // Проверяем валидность токена
        const validateUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/validate-invite/${startPayload}`;
        console.log(`🔍 Bot: Validating invite token at URL: ${validateUrl}`);
        const validateResponse = await fetch(validateUrl);
        
        if (!validateResponse.ok) {
          throw new Error(`HTTP ${validateResponse.status}: ${validateResponse.statusText}`);
        }
        
        const validateContentType = validateResponse.headers.get('content-type');
        if (!validateContentType || !validateContentType.includes('application/json')) {
          const textResponse = await validateResponse.text();
          throw new Error(`Получен не JSON ответ при валидации: ${textResponse.substring(0, 100)}...`);
        }
        
        const validateData = await validateResponse.json();

        if (!validateData.success) {
          return ctx.reply(`❌ ${validateData.error}\n\nОбратитесь к администратору за новой ссылкой приглашения.`);
        }

        // Регистрируем сотрудника
        const registerResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            telegram_id: telegramId,
            name: userName,
            invite_token: startPayload
          })
        });

        if (!registerResponse.ok) {
          throw new Error(`HTTP ${registerResponse.status}: ${registerResponse.statusText}`);
        }
        
        const registerContentType = registerResponse.headers.get('content-type');
        if (!registerContentType || !registerContentType.includes('application/json')) {
          const textResponse = await registerResponse.text();
          throw new Error(`Получен не JSON ответ при регистрации: ${textResponse.substring(0, 100)}...`);
        }

        const registerData = await registerResponse.json();

        if (registerData.success) {
          await ctx.reply(`🎉 ${registerData.message}

✅ Регистрация завершена успешно!

⏰ *Как это работает:*
• Каждый день в 9:00 я буду спрашивать о начале работы
• В 18:00 - попрошу отчет о проделанной работе
• Вы можете использовать команду /status для проверки текущего статуса

📝 *Команды:*
/status - текущий статус
/help - справка

Удачного рабочего дня! 🚀`, 
            { parse_mode: 'Markdown' });

          // Показываем текущий статус
          setTimeout(() => {
            ctx.telegram.sendMessage(ctx.chat.id, 'Проверим ваш сегодняшний статус...');
            statusHandler(ctx);
          }, 2000);

        } else {
          ctx.reply(`❌ Ошибка регистрации: ${registerData.error}`);
        }

      } catch (error) {
        console.error('Ошибка при регистрации:', error);
        ctx.reply('😔 Произошла ошибка при регистрации. Попробуйте позже или обратитесь к администратору.');
      }

    } else {
      // Проверяем, зарегистрирован ли уже пользователь
      try {
        const statusUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/status/${telegramId}`;
        console.log(`🔍 Bot: Checking status for user ${telegramId} at URL: ${statusUrl}`);
        const statusResponse = await fetch(statusUrl);
        
        // Проверяем, что ответ в формате JSON
        console.log(`📊 Bot: Status response - Status: ${statusResponse.status}, StatusText: ${statusResponse.statusText}`);
        if (!statusResponse.ok) {
          throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
        }
        
        const statusContentType = statusResponse.headers.get('content-type');
        if (!statusContentType || !statusContentType.includes('application/json')) {
          const textResponse = await statusResponse.text();
          throw new Error(`Получен не JSON ответ: ${textResponse.substring(0, 100)}...`);
        }
        
        const statusData = await statusResponse.json();

        if (statusData.success) {
          // Пользователь уже зарегистрирован
          ctx.reply(`👋 Привет, ${statusData.employee.name}!

Вы уже зарегистрированы в системе.

📊 Используйте /status для проверки текущего статуса
📝 Используйте /help для получения справки

Хорошего рабочего дня! ✨`);

          // Показываем текущий статус
          setTimeout(() => {
            statusHandler(ctx);
          }, 1000);

        } else {
          // Пользователь не зарегистрирован
          ctx.reply(`👋 Добро пожаловать в бот учета рабочего времени *Out Time*!

🔗 Для начала работы вам нужна пригласительная ссылка от администратора компании.

📞 *Что делать:*
1. Обратитесь к администратору вашей компании
2. Попросите создать для вас пригласительную ссылку
3. Перейдите по полученной ссылке

💡 *Пригласительная ссылка выглядит так:*
\`https://t.me/your_bot?start=токен\`

❓ Если у вас есть вопросы, используйте команду /help`, 
            { parse_mode: 'Markdown' });
        }

      } catch (error) {
        console.error('Ошибка при проверке статуса:', error);
        ctx.reply('😔 Произошла ошибка. Попробуйте позже.');
      }
    }

  } catch (error) {
    console.error('Ошибка в startHandler:', error);
    ctx.reply('😔 Произошла ошибка. Попробуйте позже или обратитесь к администратору.');
  }
}

export default startHandler; 