import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient, User } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';

const logger = getLogger();
const prisma = new PrismaClient();

export async function start(bot: TelegramBot, message: Message) {
  let language: Language = languageCodeToLanguage(message.from!.language_code);
  const chat = new Chat(bot, message.chat.id, language);

  try {
    logger.debug(`[start] message = ${message}`);

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
    }

    if (existingUser && isUserChanged(existingUser, newData)) {
      await prisma.user.update({ where: { telegramId }, data: newData });
    }

    await chat.hi();
    await chat.languagesList(true);
  } catch (error: unknown) {
    logger.error(`[start] msg = ${JSON.stringify(message)}, error = ${error}`);
    await chat.technicalIssue();
  }
}

const isUserChanged = (existingUser: User, newData: Partial<User>): boolean => {
  return (Object.keys(newData) as (keyof typeof newData)[]).some(
    (key) => newData[key] !== existingUser[key],
  );
};

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
