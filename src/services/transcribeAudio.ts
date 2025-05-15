import path from 'node:path';
import fs from 'node:fs/promises';
import { nodewhisper } from 'nodejs-whisper';
import { CWD } from '../utils/projectRoot.js';

export async function transcribeAudio(url: string, chatId: number): Promise<string> {
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
    throw new Error(`Ошибка загрузки файла: ${response.statusText}`);
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
  await fs.rename(`${filePath}.wav.txt`, `${filePath}.txt`);
  await fs.rename(`${filePath}.wav.json`, `${filePath}.json`);

  // удалим оригинальный аудиофайл
  await fs.unlink(filePath);

  return filePath;
}
