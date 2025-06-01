import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

interface ComparisonResult {
  file: string;
  similarity: number;
  matchedWords: number;
  totalWords: number;
}

// Простая функция для подсчета совпадающих слов
function calculateSimilarity(
  text1: string,
  text2: string,
): { similarity: number; matchedWords: number; totalWords: number } {
  // Нормализуем тексты - приводим к нижнему регистру и убираем лишние символы
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const words1 = normalize(text1).split(' ');
  const words2 = normalize(text2).split(' ');

  // Создаем множество слов из эталонного текста
  const referenceWords = new Set(words1);
  const totalWords = referenceWords.size;

  // Подсчитываем совпадающие слова
  let matchedWords = 0;
  for (const word of words2) {
    if (referenceWords.has(word)) {
      matchedWords++;
    }
  }

  // Вычисляем процент сходства
  const similarity = totalWords > 0 ? (matchedWords / totalWords) * 100 : 0;

  return {
    similarity: Math.round(similarity * 100) / 100, // округляем до 2 знаков
    matchedWords,
    totalWords,
  };
}

export function compareTexts(referencePath: string, folderPath: string): ComparisonResult[] {
  const referenceText = readFileSync(referencePath, 'utf-8').trim();
  const files = readdirSync(folderPath);
  const results: ComparisonResult[] = [];

  for (const file of files) {
    const fullPath = join(folderPath, file);
    if (fullPath === referencePath || !file.endsWith('.txt')) continue;

    const text = readFileSync(fullPath, 'utf-8').trim();
    const { similarity, matchedWords, totalWords } = calculateSimilarity(referenceText, text);

    results.push({
      file,
      similarity,
      matchedWords,
      totalWords,
    });
  }

  // Сортируем по убыванию сходства
  return results.sort((a, b) => b.similarity - a.similarity);
}

// Пример вызова, только если файл запущен напрямую
if (process.argv[1]?.includes('compare.ts')) {
  const __dirname = new URL('.', import.meta.url).pathname;
  const reference = join(__dirname, 'texts/reference.txt');
  const folder = join(__dirname, 'texts');

  console.log('Сравнение текстов с эталонным файлом:');
  console.log('Эталон:', reference);
  console.log('Папка:', folder);
  console.log('---');

  const results = compareTexts(reference, folder);

  if (results.length === 0) {
    console.log('Файлы для сравнения не найдены');
  } else {
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file}`);
      console.log(`   Сходство: ${result.similarity}%`);
      console.log(`   Совпадений: ${result.matchedWords}/${result.totalWords} слов`);
      console.log('');
    });
  }
}
