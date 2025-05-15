import { PrismaClient, User } from '@prisma/client';
import { User as TelegramUser } from 'node-telegram-bot-api';
import { getLogger } from '../classes/Logger.js';

const logger = getLogger();

const prisma = new PrismaClient();

export async function syncUser(tgUser: TelegramUser | undefined): Promise<void> {
  try {
    logger.debug(`[middlewares/syncUser] tgUser = ${JSON.stringify(tgUser)}`);
    if (!tgUser) throw new Error('tgUser is undefined');

    const telegramId = BigInt(tgUser.id);
    const newData: Pick<User, 'firstName' | 'lastName' | 'username' | 'languageCode'> = {
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      username: tgUser.username ?? null,
      languageCode: tgUser.language_code ?? null,
    };

    const existingUser = await prisma.user.findUnique({ where: { telegramId } });

    if (existingUser) {
      const isChanged = isUserChanged(existingUser, newData);
      if (isChanged) await prisma.user.update({ where: { telegramId }, data: newData });
    }
  } catch (err: unknown) {
    logger.error(`[middlewares/syncUser] tgUser = ${JSON.stringify(tgUser)}, err = ${err}`);
    return;
  }
}

const isUserChanged = (existingUser: User, newData: Partial<User>): boolean => {
  return (Object.keys(newData) as (keyof typeof newData)[]).some(
    (key) => newData[key] !== existingUser[key],
  );
};
