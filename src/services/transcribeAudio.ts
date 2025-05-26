import path from 'node:path';
import fs from 'node:fs/promises';
import { nodewhisper } from 'nodejs-whisper';
import { CWD } from '../utils/projectRoot.js';
import pLimit from 'p-limit';
import { getLogger } from '../classes/Logger.js';

const logger = getLogger();
const transcriptionLimit = pLimit(2);

interface TranscriptionResult {
  file: string;
  previewText: string;
  languageCode: string | undefined;
}

export async function transcribeAudio(
  url: string,
  chatId: number,
): Promise<TranscriptionResult | null> {
  const dir = path.join(CWD, 'texts', String(chatId));
  const timestamp = getFormattedTimestamp();
  const basePath = path.join(dir, timestamp);

  try {
    logger.debug(`[services/transcribeAudio] url = ${url}, chatId = ${chatId}`);
    await fs.mkdir(dir, { recursive: true });

    const resultFile = `${timestamp}.txt`;

    // скачиваем и сохраняем файл
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    await fs.writeFile(basePath, Buffer.from(await response.arrayBuffer()));

    // транскрибация
    await transcriptionLimit(() =>
      nodewhisper(basePath, {
        modelName: 'large-v3-turbo',
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

    // язык
    const json = JSON.parse(jsonString);
    const languageCode = json?.result?.language ?? undefined;

    return {
      file: resultFile,
      previewText: fullText.length <= 2024 ? fullText : fullText.slice(0, 2024) + '...',
      languageCode,
    };
  } catch (error: unknown) {
    logger.error(`[services/transcribeAudio] url = ${url}, chatId = ${chatId}, error = ${error}`);
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
