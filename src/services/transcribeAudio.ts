import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { CWD } from '../utils/projectRoot.js';
import pLimit from 'p-limit';
import { getLogger } from '../classes/Logger.js';
import { Chat } from '../classes/Chat.js';
import { PrismaClient } from '@prisma/client';
import { WhisperModel } from '../types/whisper.js';
import { requireEnv } from '../utils/requireEnv.js';

const logger = getLogger();
const prisma = new PrismaClient();
const transcriptionLimit = pLimit(1);

interface TranscriptionResult {
  file: string;
  previewText: string;
}

interface TranscriptionMetrics {
  chatId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  whisperModel: WhisperModel;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  languageCode?: string;
  error?: string;
}

export async function transcribeAudio(
  model: WhisperModel,
  url: string,
  chatId: number,
  chat: Chat,
  messageId: number,
  fileName: string,
  duration: string,
  mimeType: string = 'unknown',
): Promise<TranscriptionResult | null> {
  const dir = path.join(CWD, 'texts', String(chatId));
  const timestamp = getFormattedTimestamp();
  const basePath = path.join(dir, timestamp);
  const wavPath = `${basePath}.wav`;
  const jsonPath = `${basePath}.json`;
  const txtPath = `${basePath}.txt`;

  const metrics: TranscriptionMetrics = {
    chatId,
    fileName: `${timestamp}.txt`, // результирующий файл всегда .txt
    fileSize: 0,
    whisperModel: model,
    mimeType,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
    success: false,
  };

  try {
    logger.debug(
      `[services/transcribeAudio] url = ${url}, chatId = ${chatId}, mimeType = ${mimeType}`,
    );

    logger.info(
      `[new transcription] chatId=${chatId}, model=${model}, fileName=${fileName}, mimeType=${mimeType}, duration=${duration}`,
    );

    await fs.mkdir(dir, { recursive: true });

    // скачиваем и сохраняем файл
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    metrics.fileSize = audioBuffer.length;
    await fs.writeFile(basePath, audioBuffer);

    await chat.transcribeProcessingStart(messageId, fileName, duration);

    // транскрибация
    await transcriptionLimit(async () => {
      await convertAudioToWav(basePath, wavPath);
      await transcribeWithWhisperCpp(basePath, wavPath, model, chat, messageId, fileName, duration);
    });

    const [jsonString, fullText] = await Promise.all([
      fs.readFile(jsonPath, 'utf-8'),
      fs.readFile(txtPath, 'utf-8'),
    ]);

    // язык транскрипции
    const json = JSON.parse(jsonString);
    const languageCode = json?.result?.language ?? undefined;

    // Уведомляем пользователя о завершении транскрипции
    if (messageId) {
      await chat.transcribeCompleted(messageId, fileName, duration, languageCode || 'undefined');
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;
    metrics.languageCode = languageCode;

    logTranscriptionMetrics(metrics);

    return {
      file: metrics.fileName,
      previewText: fullText.length <= 2024 ? fullText : fullText.slice(0, 2024) + '...',
    };
  } catch (error: unknown) {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = String(error);

    logTranscriptionMetrics(metrics);

    logger.error(
      `[services/transcribeAudio] url = ${url}, chatId = ${chatId}, mimeType = ${mimeType}, error = ${error}`,
    );
    return null;
  } finally {
    await Promise.allSettled([
      fs.unlink(basePath).catch((error: unknown) => {
        logger.error(
          `[services/transcribeAudio] Failed to delete original file: ${basePath}, error: ${error}`,
        );
      }),
      fs.unlink(wavPath).catch((error: unknown) => {
        logger.error(
          `[services/transcribeAudio] Failed to delete WAV file: ${wavPath}.json, error: ${error}`,
        );
      }),
      fs.unlink(jsonPath).catch((error: unknown) => {
        logger.error(
          `[services/transcribeAudio] Failed to delete JSON file: ${jsonPath}, error: ${error}`,
        );
      }),
    ]);
  }
}

const getFormattedTimestamp = (): string => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0'),
  ].join('-');
};

const logTranscriptionMetrics = async (metrics: TranscriptionMetrics): Promise<void> => {
  const status = metrics.success ? true : false;
  const duration = Math.round(metrics.duration / 1000);

  await prisma.transcriptionLog.create({
    data: {
      fileName: metrics.fileName,
      fileSize: metrics.fileSize,
      mimeType: metrics.mimeType,
      whisperModel: metrics.whisperModel,
      startTime: new Date(metrics.startTime),
      endTime: new Date(metrics.endTime),
      duration: duration,
      success: status,
      detectedLang: metrics.languageCode,
    },
  });
};

/**
 * Функция конвертации аудио в формат WAV 16-bit для whisper.cpp
 * @param inputPath - путь к исходному аудиофайлу
 * @param outputPath - путь к выходному WAV файлу
 */
async function convertAudioToWav(inputPath: string, outputPath: string): Promise<void> {
  logger.debug(
    `[services/transcribeAudio/convertAudioToWav] inputPath = ${inputPath}, outputPath = ${outputPath}`,
  );

  return new Promise((resolve, reject) => {
    const args = [
      '-i',
      inputPath,
      '-ar',
      '16000', // частота дискретизации 16kHz
      '-ac',
      '1', // моно (1 канал)
      '-c:a',
      'pcm_s16le', // кодек: 16-bit PCM little-endian
      '-y', // перезаписать выходной файл без запроса
      outputPath, // выходной файл
    ];

    const ffmpegProcess = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    ffmpegProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(
          `[services/transcribeAudio/convertAudioToWav] FFmpeg process failed with code ${code}`,
        );
        logger.error(`[services/transcribeAudio/convertAudioToWav] stderr: ${stderr}`);
        reject(new Error(`FFmpeg process failed with code ${code}: ${stderr}`));
      }
    });

    ffmpegProcess.on('error', (error) => {
      logger.error(
        `[services/transcribeAudio/convertAudioToWav] Failed to start ffmpeg process: ${error}`,
      );
      reject(error);
    });
  });
}

/**
 * Функция транскрипции аудио с помощью whisper.cpp
 * @param basePath - базовый путь для выходных файлов
 * @param audioPath - путь к аудиофайлу
 * @param model - модель whisper для использования
 * @param chat - объект чата для обновления прогресса
 * @param messageId - ID сообщения для редактирования
 */
async function transcribeWithWhisperCpp(
  basePath: string,
  audioPath: string,
  model: WhisperModel,
  chat: Chat,
  messageId: number,
  fileName: string,
  duration: string,
): Promise<void> {
  logger.debug(
    '[services/transcribeAudio/transcribeWithWhisperCpp]' +
      `basePath = ${basePath}, audioPath = ${audioPath}, model = ${model}` +
      `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}`,
  );

  const whisperPath = requireEnv('WHISPER_PATH');
  const threads = requireEnv('WHISPER_THREADS');

  return new Promise((resolve, reject) => {
    const whisperBinary = path.join(whisperPath, 'build', 'bin', 'whisper-cli');
    const modelFile = path.join(whisperPath, 'models', `ggml-${model}.bin`);

    const args = [
      '-m',
      modelFile,
      '-f',
      audioPath,
      '-t',
      threads,
      '--language',
      'auto',
      '--output-json',
      '--output-txt',
      '--output-file',
      basePath, // указываем базовое имя для выходных файлов
      '--print-progress', // добавляем параметр для отображения прогресса
    ];

    const whisperProcess = spawn(whisperBinary, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let lastProgressUpdate = Date.now();

    whisperProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    whisperProcess.stderr.on('data', async (data) => {
      const output = data.toString();
      stderr += output;

      // Обрабатываем прогресс из stderr (whisper.cpp выводит прогресс в stderr)
      if (chat && messageId) {
        const progressMatch = output.match(/progress =\s+(\d+)%/);

        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const now = Date.now();

          // Обновляем прогресс максимум раз в 2 секунды, чтобы не спамить API
          if (now - lastProgressUpdate > 2000) {
            lastProgressUpdate = now;
            await chat.transcribeProgressUpdate(messageId, fileName, duration, progress);
          }
        }
      }
    });

    whisperProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(
          `[services/transcribeAudio/transcribeWithWhisperCpp] Whisper process failed with code ${code}`,
        );
        logger.error(`[services/transcribeAudio/transcribeWithWhisperCpp] stderr: ${stderr}`);
        reject(new Error(`Whisper process failed with code ${code}: ${stderr}`));
      }
    });

    whisperProcess.on('error', (error) => {
      logger.error(
        `[services/transcribeAudio/transcribeWithWhisperCpp] Failed to start whisper process: ${error}`,
      );
      reject(error);
    });
  });
}
