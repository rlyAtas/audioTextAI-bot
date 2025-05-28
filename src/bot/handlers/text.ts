import TelegramBot, { Message } from 'node-telegram-bot-api';
import { start } from './text/start.js';
import { help } from './text/help.js';
import { model } from './text/model.js';

const routes = [
  { test: (text: string) => text === '/start', handler: start },
  { test: (text: string) => text === '/help', handler: help },
  { test: (text: string) => text.startsWith('/model'), handler: model },
];

export function handlerText(bot: TelegramBot, msg: Message) {
  for (const route of routes) {
    if (msg.text && route.test(msg.text)) {
      route.handler(bot, msg);
    }
  }
}
