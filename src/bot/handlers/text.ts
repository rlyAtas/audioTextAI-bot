import TelegramBot, { Message } from 'node-telegram-bot-api';
import { start } from './text/start.js';
import { help } from './text/help.js';
import { getLogger } from '../../classes/Logger.js';

const logger = getLogger();

const routes = [
  { test: (text: string) => text === '/start', handler: start },
  { test: (text: string) => text === '/help', handler: help },
];

export function handlerText(bot: TelegramBot, msg: Message) {
  try {
    logger.debug(`[handlerText] msg = ${JSON.stringify(msg)}`);
    for (const route of routes) {
      if (msg.text && route.test(msg.text)) {
        route.handler(bot, msg);
      }
    }
  } catch (err: unknown) {
    logger.error(`[handlerText] msg = ${JSON.stringify(msg)}, err = ${err}`);
    bot.sendMessage(
      msg.chat.id,
      '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.',
    );
  }
}
