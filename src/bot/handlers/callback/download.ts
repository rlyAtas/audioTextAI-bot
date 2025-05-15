import TelegramBot from 'node-telegram-bot-api';
import path from 'node:path';
import { getLogger } from '../../../classes/Logger.js';
import { CWD } from '../../../utils/projectRoot.js';

const logger = getLogger();

export async function download(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  try {
    logger.debug(`[download] query = ${JSON.stringify(query)}`);
    const chatId = query.message!.chat.id;
    const fileName = query.data?.split('_')[1];
    const filePath = path.join(CWD, `/texts/${chatId}/${fileName}.txt`);
    console.log('filePath = ', filePath);
    await bot.sendDocument(chatId, filePath, {
      caption: '📥 Файл с результатом транскрибации',
    });
  } catch (err: unknown) {
    logger.error(`[download] query = ${JSON.stringify(query)}, err = ${err}`);
    bot.answerCallbackQuery(query.id, {
      text: '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.',
      show_alert: true,
    });
  }
}
