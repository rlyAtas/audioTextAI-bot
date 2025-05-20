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

const key = 'buttonTranscriptionResult';

addTranslation('russian', key, 'Скачать файл с результатом');
addTranslation('english', key, 'Download result file');
addTranslation('deutsch', key, 'Ergebnisdatei herunterladen');
addTranslation('ukrainian', key, 'Завантажити файл з результатом');
addTranslation('spanish', key, 'Descargar archivo con el resultado');
addTranslation('french', key, 'Télécharger le fichier de résultat');
addTranslation('arabic', key, '\u200Fتحميل ملف النتيجة');
