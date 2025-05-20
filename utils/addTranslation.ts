import fs from 'fs';
import path from 'path';
import { Language } from '../src/types/common.js';

export function addTranslation(
  language: Language,
  key: string,
  text: string,
): Record<string, string> {
  const filePath = path.resolve('src', 'locales', `${language}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file not found for language: ${language}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const translations = JSON.parse(raw) as Record<string, string>;

  if (translations.hasOwnProperty(key)) {
    throw new Error(`Key '${key}' already exists in ${language}.json`);
  }

  translations[key] = text;

  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');

  return translations;
}

const key = 'transcribeDownload';

addTranslation('russian', key, 'Файл с результатом транскрибации');
addTranslation('english', key, 'File with transcription result');
addTranslation('deutsch', key, 'Datei mit Transkriptionsergebnis');
addTranslation('ukrainian', key, 'Файл з результатом транскрипції');
addTranslation('spanish', key, 'Archivo con el resultado de la transcripción');
addTranslation('french', key, 'Fichier avec le résultat de la transcription');
addTranslation('arabic', key, '\u200Fملف يحتوي على نتيجة النسخ');
