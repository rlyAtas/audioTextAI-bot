import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';

const logger = getLogger();
const prisma = new PrismaClient();

export async function language(bot: TelegramBot, msg: Message) {
  let language: Language = 'english';

  try {
    logger.debug(`[bot/handlers/text/language] message = ${JSON.stringify(msg)}`);

    const telegramId = BigInt(msg.from!.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    language = (user?.language as Language) || 'english';

    const chat = await Chat.create(bot, msg.chat.id, language);

    await chat.languagesList(false);
  } catch (error: unknown) {
    logger.error(`[bot/handlers/text/language] message = ${JSON.stringify(msg)}, error = ${error}`);
    const chat = await Chat.create(bot, msg.chat.id, language);
    await chat.technicalIssue();
  }
}
