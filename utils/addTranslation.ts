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

addTranslation('russian', 'technicalIssue', '⚠️\nПроизошла техническая ошибка.\nМы уже работаем над её устранением.');
addTranslation('english', 'technicalIssue', '⚠️\nWe have temporary technical difficulties.\nWe are already working on fixing it.');
addTranslation('deutsch', 'technicalIssue', '⚠️\nWir haben temporäre technische Schwierigkeiten.\nWir arbeiten bereits daran, sie zu beheben.');
addTranslation('ukrainian', 'technicalIssue', '⚠️\nУ нас є тимчасові технічні труднощі.\nМи вже працюємо над їх вирішенням.');
addTranslation('spanish', 'technicalIssue', '⚠️\nTenemos dificultades técnicas temporales.\nYa estamos trabajando en solucionarlos.');
addTranslation('french', 'technicalIssue', '⚠️\nNous avons des difficultés techniques temporaires.\nNous travaillons déjà à les résoudre.');
addTranslation('arabic', 'technicalIssue', '⚠️\nلدينا مشاكل فنية تمريرية.\nنحن نعمل بالفعل على حلها.');
