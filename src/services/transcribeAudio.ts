import path from 'node:path';
import fs from 'node:fs/promises';
import { nodewhisper } from 'nodejs-whisper';
import { CWD } from '../utils/projectRoot.js';
import pLimit from 'p-limit';
import { getLogger } from '../classes/Logger.js';
import { PrismaClient } from '@prisma/client';
import { defaultWhisperModel, WhisperModel } from '../types/whisper.js';

const logger = getLogger();
const prisma = new PrismaClient();
const transcriptionLimit = pLimit(2);

interface TranscriptionResult {
  file: string;
  previewText: string;
  languageCode: string | undefined;
}

interface TranscriptionMetrics {
  chatId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  languageCode?: string;
  error?: string;
}

export async function transcribeAudio(
  url: string,
  chatId: number,
  mimeType: string = 'unknown',
): Promise<TranscriptionResult | null> {
  const dir = path.join(CWD, 'texts', String(chatId));
  const timestamp = getFormattedTimestamp();
  const basePath = path.join(dir, timestamp);

  const metrics: TranscriptionMetrics = {
    chatId,
    fileName: `${timestamp}.txt`, // результирующий файл всегда .txt
    fileSize: 0,
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
    await fs.mkdir(dir, { recursive: true });

    // скачиваем и сохраняем файл
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    metrics.fileSize = audioBuffer.length;
    await fs.writeFile(basePath, audioBuffer);

    // транскрибация
    const currentModel = await getCurrentWhisperModel();
    await transcriptionLimit(() =>
      nodewhisper(basePath, {
        modelName: currentModel,
        removeWavFileAfterTranscription: true,
        whisperOptions: {
          outputInText: true,
          outputInJsonFull: true,
        },
      }),
    );

    // переименуем .txt и читаем результат
    await fs.rename(`${basePath}.wav.txt`, `${basePath}.txt`);
    const [jsonString, fullText] = await Promise.all([
      fs.readFile(`${basePath}.wav.json`, 'utf-8'),
      fs.readFile(`${basePath}.txt`, 'utf-8'),
    ]);

    // язык транскрипции
    const json = JSON.parse(jsonString);
    const languageCode = json?.result?.language ?? undefined;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;
    metrics.languageCode = languageCode;

    logTranscriptionMetrics(metrics);

    return {
      file: metrics.fileName,
      previewText: fullText.length <= 2024 ? fullText : fullText.slice(0, 2024) + '...',
      languageCode,
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
      fs.unlink(`${basePath}.wav.json`).catch((error: unknown) => {
        logger.error(
          `[services/transcribeAudio] Failed to delete JSON file: ${basePath}.wav.json, error: ${error}`,
        );
      }),
      fs.unlink(basePath).catch((error: unknown) => {
        logger.error(
          `[services/transcribeAudio] Failed to delete original file: ${basePath}, error: ${error}`,
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function logTranscriptionMetrics(metrics: TranscriptionMetrics): void {
  const status = metrics.success ? 'SUCCESS' : 'FAILED';
  const duration = (metrics.duration / 1000).toFixed(2);

  if (metrics.success) {
    logger.info(
      `[TRANSCRIPTION_${status}] ` +
        `ChatId: ${metrics.chatId}, ` +
        `ResultFile: ${metrics.fileName}, ` +
        `Size: ${formatFileSize(metrics.fileSize)}, ` +
        `Type: ${metrics.mimeType}, ` +
        `Duration: ${duration}s, ` +
        `Language: ${metrics.languageCode || 'unknown'}`,
    );
  } else {
    logger.error(
      `[TRANSCRIPTION_${status}] ` +
        `ChatId: ${metrics.chatId}, ` +
        `ResultFile: ${metrics.fileName}, ` +
        `Size: ${formatFileSize(metrics.fileSize)}, ` +
        `Type: ${metrics.mimeType}, ` +
        `Duration: ${duration}s, ` +
        `Error: ${metrics.error}`,
    );
  }
}

async function getCurrentWhisperModel(): Promise<WhisperModel> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: 'whisperModel' },
  });
  if (!setting) throw new Error('Whisper model setting not found');
  const modelName = setting.value as WhisperModel;
  return modelName;
}
