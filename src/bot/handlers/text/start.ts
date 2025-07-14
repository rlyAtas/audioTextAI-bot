import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient, User } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';

const logger = getLogger();
const prisma = new PrismaClient();

export async function start(bot: TelegramBot, message: Message) {
  let language: Language = languageCodeToLanguage(message.from!.language_code);
  const chat = await Chat.create(bot, message.chat.id, language);

  try {
    logger.debug(`[bot/handlers/text/start] message = ${JSON.stringify(message)}`);

    const newData: Pick<User, 'firstName' | 'lastName' | 'username' | 'languageCode'> = {
      firstName: message.from!.first_name,
      lastName: message.from!.last_name ?? null,
      username: message.from!.username ?? null,
      languageCode: message.from!.language_code ?? null,
    };

    const telegramId = BigInt(message.from!.id);
    const existingUser = await prisma.user.findUnique({ where: { telegramId } });

    if (!existingUser) {
      await prisma.user.create({ data: { telegramId, ...newData } });
      await prisma.user.update({ where: { telegramId }, data: { language } });

      logger.info(
        `[new user] telegramId=${telegramId}, username=${newData.username || 'none'}, firstName=${newData.firstName}, language=${language}`,
      );

      await chat.languagesList(true);
    }

    await chat.hi();
  } catch (error: unknown) {
    logger.error(
      `[bot/handlers/text/start] msg = ${JSON.stringify(JSON.stringify(message))}, error = ${error}`,
    );
    await chat.technicalIssue();
  }
}

const languageCodeToLanguage = (languageCode: string | undefined): Language => {
  const languageMap: { codes: string[]; language: Language }[] = [
    { codes: ['ru'], language: 'russian' },
    { codes: ['en'], language: 'english' },
    { codes: ['de'], language: 'deutsch' },
    { codes: ['uk'], language: 'ukrainian' },
    { codes: ['es'], language: 'spanish' },
    { codes: ['fr'], language: 'french' },
    { codes: ['ar'], language: 'arabic' },
  ];

  const code = languageCode?.toLowerCase();
  const match = languageMap.find(({ codes }) => code && codes.includes(code));
  return match ? match.language : 'english';
};
