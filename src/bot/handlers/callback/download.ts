import TelegramBot from 'node-telegram-bot-api';
import path from 'node:path';
import { getLogger } from '../../../classes/Logger.js';
import { CWD } from '../../../utils/projectRoot.js';
import { PrismaClient } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';

const logger = getLogger();
const prisma = new PrismaClient();

export async function download(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  let language: Language = 'english';

  try {
    logger.debug(`[bot/handlers/callback/download] query = ${JSON.stringify(query)}`);

    // Получаем язык из базы данных
    const telegramId = BigInt(query.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    language = user!.language as Language;

    const chatId = query.message!.chat.id;
    const fileName = query.data?.split('_')[1];
    const file = path.join(CWD, `/texts/${chatId}/${fileName}`);

    const chat = await Chat.create(bot, query.message!.chat.id, language);
    await chat.transcribeDownload(file);
  } catch (err: unknown) {
    logger.error(`[bot/handlers/callback/download] query = ${JSON.stringify(query)}, err = ${err}`);
    const chat = await Chat.create(bot, query.message!.chat.id, language);
    await chat.technicalIssue();
  }
}
