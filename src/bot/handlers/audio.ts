import TelegramBot, { Message } from 'node-telegram-bot-api';
import { transcribeAudio } from '../../services/transcribeAudio.js';
import { getLogger } from '../../classes/Logger.js';
import { Chat } from '../../classes/Chat.js';
import { Language } from '../../types/common.js';
import { PrismaClient } from '@prisma/client';
// этот файл лежит в types но это не корректно
import { WhisperModel } from '../../types/whisper.js';

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
    language = user!.language as Language;

    const chat = await Chat.create(bot, chatId, language);

    // wav файлы могут быть восприняты как document, а ogg файлы как voice, остальные как audio
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

    const fileName = getFileName(message);
    const duration = getDuration(message);

    const tgMessage = await chat.transcribeFileReceived(fileName, duration);
    if (tgMessage === null) throw new Error('Failed to send transcribe file received message');

    const fileLink = await bot.getFileLink(audio.file_id);

    const model = await getCurrentWhisperModel();
    const transcribe = await transcribeAudio(
      model,
      fileLink,
      chatId,
      chat,
      tgMessage.message_id,
      fileName,
      duration,
      audio.mime_type,
    );
    if (transcribe === null) throw new Error('Transcription failed');

    const { file, previewText } = transcribe;
    await chat.transcribeResult(file, previewText);
  } catch (error: unknown) {
    logger.error(`[handlerAudio] msg = ${JSON.stringify(message)}, error = ${error}`);
    const chat = await Chat.create(bot, chatId, language);
    await chat.technicalIssue();
  }
}

// TODO подумай еще раз о создании класса, у тебя в types лежат типы и хелперы
async function getCurrentWhisperModel(): Promise<WhisperModel> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: 'whisperModel' },
  });
  if (!setting) throw new Error('Whisper model setting not found');
  const modelName = setting.value as WhisperModel;
  return modelName;
}

function getFileName(message: Message): string {
  if (message.audio) return message.audio.title || 'audio';
  if (message.document) return message.document.file_name || 'document';
  if (message.voice) return 'voice';
  return 'unknown';
}

function getDuration(message: Message): string {
  let seconds: number | undefined;
  if (message.audio) seconds = message.audio.duration;
  if (message.voice) seconds = message.voice.duration;
  if (seconds === undefined) return 'unknown';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
