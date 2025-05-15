import dotenv from 'dotenv';
import ngrok from '@ngrok/ngrok';
import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { setWebhook } from './utils/setWebhook.js';
import { requireEnv } from './utils/requireEnv.js';
import { initBot } from './bot/initBot.js';
import { getLogger } from './classes/Logger.js';

dotenv.config();
const logger = getLogger();
let server;

const app = express();
app.use(express.json());

const bot = new TelegramBot(requireEnv('BOT_TOKEN'), {
  webHook: true,
});
initBot(bot);

app.post(`/bot${process.env.BOT_TOKEN}`, (req: Request, res: Response) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

if (process.env.NODE_ENV === 'test') {
  server = app.listen(process.env.PORT_TEST, () => {
    logger.info(`[index] App test on production mode on port ${process.env.PORT_TEST}`);
  });
}

if (process.env.NODE_ENV === 'development') {
  server = app.listen(process.env.PORT, () => {
    logger.info(`[index] App started on development mode on port ${process.env.PORT}`);
  });
  const listener = await ngrok.forward({
    addr: process.env.PORT,
    authtoken_from_env: true,
  });
  const ngrokWebhook = listener.url();
  if (!ngrokWebhook) throw new Error('Ngrok failed to provide a valid URL');
  setWebhook(ngrokWebhook, requireEnv('BOT_TOKEN'));
}

if (process.env.NODE_ENV === 'production') {
  server = app.listen(process.env.PORT, () => {
    logger.info(`[index] App started on production mode on port ${process.env.PORT}`);
  });
  setWebhook(requireEnv('BOT_WEBHOOK'), requireEnv('BOT_TOKEN'));
}

export { server, app };
