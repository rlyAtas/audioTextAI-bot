import TelegramBot from 'node-telegram-bot-api';
import { download } from './callback/download.js';
import { startLanguageSet } from './callback/startLanguageSet.js';
import { languageSet } from './callback/languageSet.js';

const routes = [
  { test: (data: string) => data.split('_')[0] === 'download', handler: download },
  { test: (data: string) => data.split('_')[0] === 'startLanguageSet', handler: startLanguageSet },
  { test: (data: string) => data.split('_')[0] === 'languageSet', handler: languageSet },
];

export function handlerCallback(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  for (const route of routes) {
    if (query.data && route.test(query.data)) {
      route.handler(bot, query);
    }
  }
}
