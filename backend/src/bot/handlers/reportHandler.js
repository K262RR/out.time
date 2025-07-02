async function reportHandler(ctx) {
  try {
    const telegramId = ctx.from.id;
    const reportText = ctx.message.text;

    // Игнорируем команды
    if (reportText.startsWith('/')) {
      return;
    }

    // Проверяем минимальную длину отчета
    if (reportText.trim().length < 5) {
      return ctx.reply(`📝 Отчет слишком короткий!

Минимум 5 символов. Опишите:
• Что конкретно сделали сегодня?
• Какие задачи выполнили?
• Были ли проблемы или вопросы?

Попробуйте еще раз 👇`);
    }

    // Проверяем максимальную длину
    if (reportText.length > 2000) {
      return ctx.reply(`📝 Отчет слишком длинный!

Максимум 2000 символов. Постарайтесь быть более кратким, но информативным.

Текущая длина: ${reportText.length} символов`);
    }

    // Отправляем отчет в API
    try {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/end-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegram_id: telegramId,
          content: reportText.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        await ctx.reply(`✅ ${data.message}

📊 *Ваш отчет принят и сохранен*

🕐 Рабочий день завершен
📝 Отчет: ${Math.min(reportText.length, 100)}${reportText.length > 100 ? '...' : ''} символов

Спасибо за работу! До встречи завтра 👋`, 
          { parse_mode: 'Markdown' });

      } else {
        // Обрабатываем различные ошибки
        if (data.error.includes('Сначала отметьтесь')) {
          ctx.reply(`⚠️ Сначала нужно отметить начало рабочего дня!

Используйте /status для проверки текущего статуса или дождитесь утреннего уведомления.`);
        } else if (data.error.includes('уже завершен')) {
          ctx.reply(`ℹ️ Рабочий день уже завершен и отчет сдан.

Используйте /status для проверки информации.`);
        } else {
          ctx.reply(`❌ Ошибка: ${data.error}`);
        }
      }

    } catch (error) {
      console.error('Ошибка отправки отчета:', error);
      ctx.reply(`😔 Произошла ошибка при отправке отчета.

Ваш отчет сохранен локально:
"${reportText.substring(0, 200)}${reportText.length > 200 ? '...' : ''}"

Попробуйте отправить позже или обратитесь к администратору.`);
    }

  } catch (error) {
    console.error('Ошибка в reportHandler:', error);
    ctx.reply('😔 Произошла ошибка при обработке отчета. Попробуйте позже.');
  }
}

export default reportHandler; 