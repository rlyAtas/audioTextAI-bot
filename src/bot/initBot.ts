import TelegramBot from 'node-telegram-bot-api';
import { handlerAudio } from './handlers/audio.js';
import { handlerText } from './handlers/text.js';
import { handlerCallback } from './handlers/callback.js';
import { syncUser } from '../middlewares/syncUser.js';

export function initBot(bot: TelegramBot) {
  bot.on('document', async (msg) => {
    await syncUser(msg.from);
    handlerAudio(bot, msg);
  });
  bot.on('audio', async (msg) => {
    await syncUser(msg.from);
    handlerAudio(bot, msg);
  });
  bot.on('voice', async (msg) => {
    await syncUser(msg.from);
    handlerAudio(bot, msg);
  });

  bot.on('message', async (msg) => {
    await syncUser(msg.from);
    handlerText(bot, msg);
  });

  bot.on('callback_query', async (query) => {
    await syncUser(query.from);
    handlerCallback(bot, query);
  });
}
