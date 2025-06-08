import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';
import { PrismaClient } from '@prisma/client';

const logger = getLogger();
const prisma = new PrismaClient();

/**
 * The method gets the user's language and stores it in the database
 * @param bot - Telegram bot instance
 * @param query - Telegram callback query
 */
export async function languageSet(bot: TelegramBot, query: CallbackQuery) {
  const language = query.data?.split('_')[1] as Language;
  const chat = await Chat.create(bot, query.message!.chat.id, language);

  try {
    logger.debug(`[bot/handlers/callback/languageSet] query = ${JSON.stringify(query)}`);

    const telegramId = BigInt(query.from.id);
    await prisma.user.update({
      where: { telegramId },
      data: {
        language,
      },
    });
    await chat.languageSet();
  } catch (error: unknown) {
    logger.error(
      `[bot/handlers/callback/languageSet] query = ${JSON.stringify(query)}, error = ${error}`,
    );
    await chat.technicalIssue();
  }
}
