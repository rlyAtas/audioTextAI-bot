import path from 'node:path';
import fs from 'node:fs/promises';
import { nodewhisper } from 'nodejs-whisper';
import { CWD } from '../utils/projectRoot.js';

export async function transcribeAudio(
  url: string,
  chatId: number,
): Promise<Record<string, string>> {
  // создаем папку для хранения текстов
  await fs.mkdir(path.join(CWD, `/texts/${chatId}`), { recursive: true });
  // создаем имя файла, дата в формате yyyy-mm-dd-hh-mm-ss
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  // создаем имя файла
  const filePath = path.join(CWD, `/texts/${chatId}`, `${formattedDate}`);

  // скачиваем файл
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error downloading file: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // транскрибируем файл
  await nodewhisper(filePath, {
    modelName: 'large-v3-turbo',
    removeWavFileAfterTranscription: true,
    whisperOptions: {
      outputInText: true,
      outputInJsonFull: true,
    },
  });

  // переименуем файлы, чтобы убрать wav
  const resultFile = `${filePath}.txt`;
  await fs.rename(`${filePath}.wav.txt`, resultFile);

  // получим код языка
  const jsonString = await fs.readFile(`${filePath}.wav.json`, 'utf-8');
  const data = JSON.parse(jsonString);
  const languageCode = data.result?.language ?? null;

  // получим превью текста
  const text = await fs.readFile(resultFile, 'utf-8');
  const previewText = text.length <= 2024 ? text : text.slice(0, 2024) + '...';

  // удалим аудиофайл и json
  await fs.unlink(`${filePath}.wav.json`);
  await fs.unlink(filePath);

  return {
    file: resultFile,
    previewText,
    languageCode: languageCode,
  };
}
