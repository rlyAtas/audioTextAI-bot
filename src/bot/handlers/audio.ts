import TelegramBot, { Message } from 'node-telegram-bot-api';
import { transcribeAudio } from '../../services/transcribeAudio.js';
import { sendTranscriptionResult } from '../../utils/sendTranscriptionResult.js';
import { getLogger } from '../../classes/Logger.js';

const logger = getLogger();

/*
 * Получаем аудиофайл
 * Он может быть идентефицирован телеграмом как аудио, как документ и как голос
 * поэтому все хендлеры замыкаем сюда
 */
export async function handlerAudio(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;

  try {
    logger.debug(`[handlerAudio] msg = ${JSON.stringify(msg)}`);
    const audio = msg.audio || msg.document || msg.voice;
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
      bot.sendMessage(chatId, 'Этот формат пока не поддерживается.');
      return;
    }

    bot.sendMessage(
      chatId,
      '🎧 Пожалуйста, подождите, пока мы обрабатываем ваш аудиофайл. Это займет всего пару минут!',
    );

    const fileLink = await bot.getFileLink(audio.file_id);
    const resultFilePath = await transcribeAudio(fileLink, chatId);
    await sendTranscriptionResult(bot, chatId, resultFilePath);
  } catch (err: unknown) {
    logger.error(`[handlerAudio] msg = ${JSON.stringify(msg)}, err = ${err}`);
    bot.sendMessage(chatId, '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.');
  }
}

// export function handlerAudio(bot: TelegramBot) {
//   return async (msg: Message) => {
//     const chatId = msg.chat.id;
//     // msg.from.language_code

//     try {
//       logger.debug(`[handlerAudio] msg = ${JSON.stringify(msg)}`);
//       const audio = msg.audio || msg.document || msg.voice;
//       const supportedTypes = [
//         'audio/mpeg',
//         'audio/wav',
//         'audio/x-wav',
//         'audio/ogg',
//         'audio/mp4',
//         'audio/flac',
//         'audio/aac',
//       ];
//       if (!audio || !audio.mime_type || !supportedTypes.includes(audio.mime_type)) {
//         bot.sendMessage(chatId, 'Этот формат пока не поддерживается.');
//         return;
//       }

//       bot.sendMessage(
//         chatId,
//         '🎧 Пожалуйста, подождите, пока мы обрабатываем ваш аудиофайл. Это займет всего пару минут!',
//       );

//       const fileLink = await bot.getFileLink(audio.file_id);
//       const resultFilePath = await transcribeAudio(fileLink, chatId);
//       await sendTranscriptionResult(bot, chatId, resultFilePath);
//     } catch (err: unknown) {
//       logger.error(`[handlerAudio] msg = ${JSON.stringify(msg)}, err = ${err}`);
//       bot.sendMessage(
//         chatId,
//         '⚠️ Произошла техническая ошибка. Мы уже работаем над её устранением.',
//       );
//     }
//   };
// }
