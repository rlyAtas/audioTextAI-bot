import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient, User } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';

const logger = getLogger();
const prisma = new PrismaClient();

export async function start(bot: TelegramBot, msg: Message) {
  const language: Language = languageCodeToLanguage(msg.from?.language_code);
  const chat = new Chat(bot, msg.chat.id, language);

  try {
    logger.debug(`[start] User ${msg.from?.id} started bot`);
    if (!msg.from) throw new Error('msg.from is undefined');

    const telegramId = BigInt(msg.from.id);
    const newData: Pick<User, 'firstName' | 'lastName' | 'username' | 'languageCode' | 'language'> = {
      firstName: msg.from.first_name,
      lastName: msg.from.last_name ?? null,
      username: msg.from.username ?? null,
      languageCode: msg.from.language_code ?? null,
      language,
    };

    const existingUser = await prisma.user.findUnique({ where: { telegramId } });

    if (!existingUser) {
      await prisma.user.create({ data: { telegramId, ...newData } });
    }

    if (existingUser && isUserChanged(existingUser, newData)) {
      await prisma.user.update({ where: { telegramId }, data: newData });
    }

    await chat.hi();
    await chat.languagesList(true);
  } catch (err: unknown) {
    logger.error(`[start] msg = ${JSON.stringify(msg)}, err = ${err}`);
    await chat.technicalIssue(language);
  }
}

const isUserChanged = (existingUser: User, newData: Partial<User>): boolean => {
  return (Object.keys(newData) as (keyof typeof newData)[]).some(
    (key) => newData[key] !== existingUser[key],
  );
};

export const languageCodeToLanguage = (languageCode: string | undefined): Language => {
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