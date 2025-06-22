const fetch = require('node-fetch');

async function startHandler(ctx) {
  try {
    const telegramId = ctx.from.id;
    const userName = ctx.from.first_name || 'Сотрудник';
    const startPayload = ctx.startPayload; // Токен приглашения

    // Если есть токен приглашения
    if (startPayload) {
      try {
        // Проверяем валидность токена
        const validateResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/validate-invite/${startPayload}`);
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
            require('./statusHandler')(ctx);
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
        const statusResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/status/${telegramId}`);
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
            require('./statusHandler')(ctx);
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

module.exports = startHandler; 