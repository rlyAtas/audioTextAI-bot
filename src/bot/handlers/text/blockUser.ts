import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient } from '@prisma/client';
import { requireEnv } from '../../../utils/requireEnv.js';

const logger = getLogger();
const prisma = new PrismaClient();

/**
 * Блокировка пользователя как спаммера
 * Команда: /block_user [telegram_id]
 * Доступна только админу
 */
export async function blockUser(bot: TelegramBot, message: Message) {
  try {
    logger.debug(`[bot/handlers/text/blockUser] message = ${JSON.stringify(message)}`);

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
        '❌ Неверный формат команды.\nИспользуйте: /block_user [telegram_id]',
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

    // Проверяем, не заблокирован ли уже
    if (user.isSpammer) {
      await bot.sendMessage(
        message.chat.id,
        `⚠️ Пользователь ${user.firstName} (@${user.username || 'none'}) уже заблокирован.`,
      );
      return;
    }

    // Блокируем пользователя
    await prisma.user.update({
      where: { telegramId: targetTelegramId },
      data: { isSpammer: true },
    });

    await bot.sendMessage(
      message.chat.id,
      `✅ Пользователь ${user.firstName} (@${user.username || 'none'}) заблокирован как спаммер.`,
    );

    logger.info(
      `[ADMIN_BLOCK] Admin=${senderTelegramId} blocked user=${targetTelegramId} (${user.firstName})`,
    );
  } catch (error: unknown) {
    logger.error(`[bot/handlers/text/blockUser] error = ${error}`);
    await bot.sendMessage(message.chat.id, '❌ Произошла ошибка при блокировке пользователя.');
  }
}
