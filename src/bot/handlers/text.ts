import TelegramBot, { Message } from 'node-telegram-bot-api';
import { start } from './text/start.js';
import { help } from './text/help.js';
import { model } from './text/model.js';
import { language } from './text/language.js';
import { blockUser } from './text/blockUser.js';
import { unblockUser } from './text/unblockUser.js';

const routes = [
  { test: (text: string) => text === '/start', handler: start },
  { test: (text: string) => text === '/help', handler: help },
  { test: (text: string) => text.startsWith('/model'), handler: model },
  { test: (text: string) => text === '/language', handler: language },
  { test: (text: string) => text.startsWith('/block_user'), handler: blockUser },
  { test: (text: string) => text.startsWith('/unblock_user'), handler: unblockUser },
];

export function handlerText(bot: TelegramBot, msg: Message) {
  for (const route of routes) {
    if (msg.text && route.test(msg.text)) {
      route.handler(bot, msg);
    }
  }
}
