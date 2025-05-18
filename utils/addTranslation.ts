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

const key = 'startLanguageSet';

addTranslation(
  'russian',
  key,
  'Приветствую!\n\nЯ бот, который превращает аудио и голосовые сообщения в текст.\n\nПросто отправь <b>голосовое сообщение</b> или <b>аудиофайл</b> — я расшифрую и пришлю текст.',
);
addTranslation(
  'english',
  key,
  'Welcome!\n\nI’m a bot that converts audio and voice messages into text.\n\nJust send a <b>voice message</b> or an <b>audio file</b> — I’ll transcribe it and send you the text.',
);
addTranslation(
  'deutsch',
  key,
  'Willkommen!\n\nIch bin ein Bot, der Audio- und Sprachnachrichten in Text umwandelt.\n\nSende einfach eine <b>Sprachnachricht</b> oder eine <b>Audiodatei</b> – ich transkribiere sie und sende dir den Text.',
);
addTranslation(
  'ukrainian',
  key,
  'Вітаю!\n\nЯ бот, який перетворює аудіо та голосові повідомлення на текст.\n\nПросто надішли <b>голосове повідомлення</b> або <b>аудіофайл</b> — я розшифрую його і надішлю тобі текст.',
);
addTranslation(
  'spanish',
  key,
  '¡Bienvenido!\n\nSoy un bot que convierte mensajes de voz y archivos de audio en texto.\n\nSimplemente envía un <b>mensaje de voz</b> o un <b>archivo de audio</b> — lo transcribiré y te enviaré el texto.',
);
addTranslation(
  'french',
  key,
  'Bienvenue !\n\nJe suis un bot qui convertit les messages vocaux et les fichiers audio en texte.\n\nEnvoie simplement un <b>message vocal</b> ou un <b>fichier audio</b> — je vais le transcrire et t’envoyer le texte.',
);
addTranslation(
  'arabic',
  key,
  '\u200Fمرحبًا!\n\nأنا بوت يحوّل الرسائل الصوتية وملفات الصوت إلى نص.\n\nفقط أرسل <b>رسالة صوتية</b> أو <b>ملف صوتي</b> — وسأرسل لك النص بعد تفريغه.',
);
