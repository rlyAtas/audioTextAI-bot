import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient } from '@prisma/client';
import { requireEnv } from '../../../utils/requireEnv.js';

const logger = getLogger();
const prisma = new PrismaClient();

/**
 * Разблокировка пользователя
 * Команда: /unblock_user [telegram_id]
 * Доступна только админу
 */
export async function unblockUser(bot: TelegramBot, message: Message) {
  try {
    logger.debug(`[bot/handlers/text/unblockUser] message = ${JSON.stringify(message)}`);

    // Проверяем, что команду выполняет админ
    const adminTelegramId = BigInt(requireEnv('ADMIN_TELEGRAM_ID'));
    const senderTelegramId = BigInt(message.from!.id);

    if (senderTelegramId !== adminTelegramId) {
      await bot.sendMessage(message.chat.id, '❌ Недостаточно прав для выполнения команды.');
      return;
    }

    // Парсим аргументы команды
    const args = message.text!.split(' ');
    if (args.length !== 2) {
      await bot.sendMessage(
        message.chat.id,
        '❌ Неверный формат команды.\nИспользуйте: /unblock_user [telegram_id]',
      );
      return;
    }

    const targetTelegramId = BigInt(args[1]);

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({ where: { telegramId: targetTelegramId } });
    if (!user) {
      await bot.sendMessage(message.chat.id, `❌ Пользователь с ID ${targetTelegramId} не найден.`);
      return;
    }

    // Проверяем, заблокирован ли пользователь
    if (!user.isSpammer) {
      await bot.sendMessage(
        message.chat.id,
        `⚠️ Пользователь ${user.firstName} (@${user.username || 'none'}) не заблокирован.`,
      );
      return;
    }

    // Разблокируем пользователя
    await prisma.user.update({
      where: { telegramId: targetTelegramId },
      data: { isSpammer: false },
    });

    await bot.sendMessage(
      message.chat.id,
      `✅ Пользователь ${user.firstName} (@${user.username || 'none'}) разблокирован.`,
    );

    logger.info(
      `[ADMIN_UNBLOCK] Admin=${senderTelegramId} unblocked user=${targetTelegramId} (${user.firstName})`,
    );
  } catch (error: unknown) {
    logger.error(`[bot/handlers/text/unblockUser] error = ${error}`);
    await bot.sendMessage(message.chat.id, '❌ Произошла ошибка при разблокировке пользователя.');
  }
}
