import TelegramBot, { Message } from 'node-telegram-bot-api';
import { transcribeAudio } from '../../services/transcribeAudio.js';
import { sendTranscriptionResult } from '../../utils/sendTranscriptionResult.js';
import { getLogger } from '../../classes/Logger.js';
import { Chat } from '../../classes/Chat.js';
import { Language } from '../../types/common.js';
import { PrismaClient, User } from '@prisma/client';

const logger = getLogger();
const prisma = new PrismaClient();

/*
 * Получаем аудиофайл
 * Он может быть идентефицирован телеграмом как аудио, как документ и как голос
 * поэтому все хендлеры замыкаем сюда
 */
export async function handlerAudio(bot: TelegramBot, message: Message) {
  const chatId = message.chat.id;
  let language: Language = 'english';

  try {
    logger.debug(`[handlerAudio] msg = ${JSON.stringify(message)}`);

    // Получаем язык из базы данных
    const telegramId = BigInt(message.from!.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    language = user!.language;

    const chat = await Chat.create(bot, chatId, language);

    const audio = message.audio || message.document || message.voice;
    const supportedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'audio/flac',
      'audio/aac',
    ];
    if (!audio || !audio.mime_type || !supportedTypes.includes(audio.mime_type)) {
      await chat.unsupportedFormat();
      return;
    }

    await chat.transcribeStart();

    const fileLink = await bot.getFileLink(audio.file_id);
    const resultFilePath = await transcribeAudio(fileLink, chatId);
    await sendTranscriptionResult(bot, chatId, resultFilePath);
  } catch (error: unknown) {
    logger.error(`[handlerAudio] msg = ${JSON.stringify(message)}, error = ${error}`);
    const chat = await Chat.create(bot, chatId, language);
    await chat.technicalIssue();
  }
}
