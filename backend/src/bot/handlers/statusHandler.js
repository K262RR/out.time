import { statusKeyboard } from '../keyboards/inline.js';

async function statusHandler(ctx) {
  try {
    const telegramId = ctx.from.id;

    // Получаем статус сотрудника
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/bot/status/${telegramId}`);
    const data = await response.json();

    if (!data.success) {
      return ctx.reply(`❌ ${data.error}\n\nИспользуйте /start для регистрации.`);
    }

    const { employee, today } = data;
    const currentTime = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let statusMessage = `📊 *Статус на сегодня* (${currentTime})\n`;
    statusMessage += `👤 Сотрудник: ${employee.name}\n\n`;

    // Статус работы
    if (!today.hasStarted) {
      statusMessage += `⚪ Рабочий день не начат\n`;
      statusMessage += `💡 Нажмите кнопку ниже или дождитесь утреннего уведомления\n`;
    } else {
      const startTime = new Date(today.startTime).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      statusMessage += `✅ Работа начата: ${startTime}\n`;
      
      if (today.status === 'sick') {
        statusMessage += `🤒 Статус: Больничный\n`;
      } else if (today.status === 'vacation') {
        statusMessage += `🏖️ Статус: Отпуск\n`;
      } else if (today.status === 'late') {
        statusMessage += `⏰ Статус: Опоздание\n`;
      } else {
        statusMessage += `🏢 Статус: Рабочий день\n`;
      }

      if (today.hasEnded) {
        const endTime = new Date(today.endTime).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        });
        statusMessage += `🏁 Работа завершена: ${endTime}\n`;
        statusMessage += `⏱️ Отработано: ${today.workDuration}\n`;
      } else if (today.status === 'work' || today.status === 'late') {
        statusMessage += `⏱️ Работаю сейчас...\n`;
      }
    }

    // Статус отчета
    statusMessage += `\n📝 *Отчет:*\n`;
    if (today.hasReport) {
      statusMessage += `✅ Отчет сдан\n`;
    } else {
      statusMessage += `⏳ Отчет не сдан\n`;
      if (today.hasStarted && !today.hasEnded) {
        statusMessage += `💡 Отправьте отчет текстовым сообщением в конце дня\n`;
      }
    }

    // Показываем кнопки действий только если нужно
    let keyboard = null;
    if (!today.hasStarted) {
      keyboard = statusKeyboard;
    } else if (today.hasStarted && !today.hasEnded && !today.hasReport && (today.status === 'work' || today.status === 'late')) {
      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Отправить отчет', callback_data: 'already_finished' }]
          ]
        }
      };
    }

    await ctx.reply(statusMessage, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    console.error('Ошибка в statusHandler:', error);
    ctx.reply('😔 Произошла ошибка при получении статуса. Попробуйте позже.');
  }
}

export default statusHandler; 