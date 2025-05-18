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

const key = 'transcribeStart';

addTranslation(
  'russian',
  key,
  'Пожалуйста, подождите, пока мы обрабатываем ваш аудиофайл. Это займет пару минут!',
);
addTranslation(
  'english',
  key,
  'Please wait while we process your audio file. This will take a couple of minutes!',
);
addTranslation(
  'deutsch',
  key,
  'Bitte warten Sie, während wir Ihre Audiodatei verarbeiten. Das dauert ein paar Minuten!',
);
addTranslation(
  'ukrainian',
  key,
  'Будь ласка, зачекайте, поки ми обробляємо ваш аудіофайл. Це займе кілька хвилин!',
);
addTranslation(
  'spanish',
  key,
  'Por favor, espera mientras procesamos tu archivo de audio. ¡Esto tomará un par de minutos!',
);
addTranslation(
  'french',
  key,
  'Veuillez patienter pendant que nous traitons votre fichier audio. Cela prendra quelques minutes !',
);
addTranslation(
  'arabic',
  key,
  '\u200Fيرجى الانتظار بينما نقوم بمعالجة ملفك الصوتي. سيستغرق ذلك بضع دقائق!',
);
