import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

export async function setWebhook(webhook: string, token: string): Promise<void> {
  try {
    const bot = new TelegramBot(token);
    const isSetting = await bot.setWebHook(`${webhook}/bot${process.env.BOT_TOKEN}`);
    if (!isSetting) throw new Error('Webhook not set');
  } catch (error: unknown) {
    console.log(error);
  }
}
