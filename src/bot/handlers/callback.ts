import TelegramBot from 'node-telegram-bot-api';
import { download } from './callback/download.js';
import { startLanguageSet } from './callback/startLanguageSet.js';
import { getLogger } from '../../classes/Logger.js';

const logger = getLogger();

const routes = [
  { test: (data: string) => data.split('_')[0] === 'download', handler: download },
  { test: (data: string) => data.split('_')[0] === 'startLanguageSet', handler: startLanguageSet },
];

export function handlerCallback(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  try {
    logger.debug(`[handlerCallback] query = ${JSON.stringify(query)}`);
    for (const route of routes) {
      if (query.data && route.test(query.data)) {
        route.handler(bot, query);
      }
    }
  } catch (err: unknown) {
    logger.error(`[handlerCallback] query = ${JSON.stringify(query)}, err = ${err}`);
    bot.answerCallbackQuery(query.id, {
      text: '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.',
      show_alert: true,
    });
  }
}
