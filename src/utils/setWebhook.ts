import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { getLogger } from '../classes/Logger.js';

const logger = getLogger();

dotenv.config();

export async function setWebhook(webhook: string, token: string): Promise<void> {
  try {
    logger.debug(`[utils/setWebhook] webhook = ${webhook}, token = ${token.split(':')[0]}...`);
    const bot = new TelegramBot(token);
    const isSetting = await bot.setWebHook(`${webhook}/bot${process.env.BOT_TOKEN}`);
    if (!isSetting) throw new Error('Webhook not set');
  } catch (error: unknown) {
    logger.error(
      `[utils/setWebhook] webhook = ${webhook}, token = ${token.split(':')[0]}..., error = ${error}`,
    );
  }
}
