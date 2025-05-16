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
    const newData: Pick<User, 'firstName' | 'lastName' | 'username' | 'languageCode'> = {
      firstName: msg.from.first_name,
      lastName: msg.from.last_name ?? null,
      username: msg.from.username ?? null,
      languageCode: msg.from.language_code ?? null,
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
    await bot.sendMessage(
      msg.chat.id,
      '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.',
    );
  }
}

const isUserChanged = (existingUser: User, newData: Partial<User>): boolean => {
  return (Object.keys(newData) as (keyof typeof newData)[]).some(
    (key) => newData[key] !== existingUser[key],
  );
};

const languageCodeToLanguage = (languageCode: string | undefined): Language => {
  switch (languageCode?.toLowerCase()) {
    case 'ru':
      return 'russian';
    case 'en':
      return 'english';
    case 'de':
      return 'deutsch';
    case 'uk':
    case 'ua':
      return 'ukrainian';
    case 'es':
      return 'spanish';
    case 'fr':
      return 'french';
    case 'ar':
      return 'arabic';
    default:
      return 'english';
  }
};
