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

const key = 'unsupportedFormat';

addTranslation('russian', key, 'Этот формат аудио пока не поддерживается.');
addTranslation('english', key, 'This audio format is not supported yet.');
addTranslation('deutsch', key, 'Dieses Audioformat wird derzeit nicht unterstützt.');
addTranslation('ukrainian', key, 'Цей формат аудіо наразі не підтримується.');
addTranslation('spanish', key, 'Este formato de audio aún no es compatible.');
addTranslation('french', key, 'Ce format audio n’est pas encore pris en charge.');
addTranslation('arabic', key, 'هذا التنسيق الصوتي غير مدعوم حالياً.');
