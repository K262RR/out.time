// Клавиатура для утренних уведомлений
const morningKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Да, начинаю', callback_data: 'start_work' },
        { text: '⏰ Опоздаю', callback_data: 'start_late' }
      ],
      [
        { text: '🏥 Больничный/отпуск', callback_data: 'sick_vacation' }
      ]
    ]
  }
};

// Клавиатура для вечерних уведомлений
const eveningKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📝 Отправить отчет', callback_data: 'already_finished' }
      ],
      [
        { text: '💪 Работаю дольше', callback_data: 'working_longer' }
      ]
    ]
  }
};

// Клавиатура для статуса
const statusKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🏢 Начать работу', callback_data: 'start_work' },
        { text: '📊 Отправить отчет', callback_data: 'already_finished' }
      ]
    ]
  }
};

// Клавиатура подтверждения отчета
const confirmReportKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Отправить', callback_data: 'confirm_report' },
        { text: '✏️ Изменить', callback_data: 'edit_report' }
      ]
    ]
  }
};

export {
  morningKeyboard,
  eveningKeyboard,
  statusKeyboard,
  confirmReportKeyboard
}; 