import TelegramBot from 'node-telegram-bot-api';
import fs from 'node:fs/promises';

export async function sendTranscriptionResult(bot: TelegramBot, chatId: number, filePath: string) {
  const text = await fs.readFile(`${filePath}.txt`, 'utf-8');
  const language = 'de';
  const previewText = text.length <= 2024 ? text : text.slice(0, 2024) + '...';
  const message =
    `🗣️ Язык: ${language}\n` + `📝 Результат транскрибации:\n\n` + `<code>${previewText}</code>`;
  const fileName = filePath.split('/').pop();
  const callbackData = `download_${fileName}`;

  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: '📥 Скачать файл с результатом', callback_data: callbackData }]],
    },
  });
}
