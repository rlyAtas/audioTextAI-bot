import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getLogger } from '../../../classes/Logger.js';
import { PrismaClient } from '@prisma/client';
import { Chat } from '../../../classes/Chat.js';
import { Language } from '../../../types/common.js';
import { isValidWhisperModel, getWhisperModels, WhisperModel } from '../../../types/whisper.js';
import { requireEnv } from '../../../utils/requireEnv.js';

const logger = getLogger();
const prisma = new PrismaClient();

/**
 * Обработчик команды /model
 * Позволяет администратору управлять моделями Whisper
 * @param bot
 * @param message
 * @returns
 */

export async function model(bot: TelegramBot, message: Message) {
  let language: Language = 'english';

  try {
    logger.debug(`[bot/handlers/text/model] message = ${JSON.stringify(message)}`);

    const telegramId = BigInt(message.from!.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    language = user!.language as Language;

    const chat = await Chat.create(bot, message.chat.id, language);

    if (telegramId.toString() !== requireEnv('ADMIN_TELEGRAM_ID')) {
      throw new Error('Unauthorized user');
    }

    const args = message.text?.split(' ');
    const command = args?.[1];
    const modelName = args?.[2];

    switch (command) {
      case 'set':
        await setModel(bot, message.chat.id, language, modelName);
        break;
      case 'list':
      default:
        await showModelsList(bot, message.chat.id, language);
        break;
    }
  } catch (error: unknown) {
    logger.error(
      `[bot/handlers/text/model] message = ${JSON.stringify(message)}, error = ${error}`,
    );
    const chat = await Chat.create(bot, message.chat.id, language);
    await chat.technicalIssue();
  }
}

async function setModel(
  bot: TelegramBot,
  chatId: number,
  language: Language,
  modelName: string = '',
) {
  const chat = await Chat.create(bot, chatId, language);

  try {
    // Проверяем валидность модели
    if (!isValidWhisperModel(modelName)) {
      const availableModels = getWhisperModels().join(', ');
      await chat.modelNotAvailable(modelName, availableModels);
      return;
    }

    // Обновляем настройку в базе данных
    await prisma.appSetting.upsert({
      where: { key: 'whisperModel' },
      update: {
        value: modelName,
        updatedAt: new Date(),
      },
      create: {
        key: 'whisperModel',
        value: modelName,
        description: 'Currently active Whisper model for transcriptions',
      },
    });

    await chat.modelSetSuccess(modelName);
    logger.info(`Whisper model changed to: ${modelName} by user ${chatId}`);
  } catch (error) {
    logger.error(`Failed to set Whisper model: ${error}`);
    await chat.technicalIssue();
  }
}

async function showModelsList(bot: TelegramBot, chatId: number, language: Language) {
  const chat = await Chat.create(bot, chatId, language);

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'whisperModel' },
    });
    if (!setting) throw new Error('Whisper model setting not found');

    const currentModel = setting.value;
    const models = getWhisperModels();

    await chat.modelsList(models, currentModel);
  } catch (error) {
    logger.error(`Failed to get models list: ${error}`);
    await chat.technicalIssue();
  }
}
