import fs from 'fs/promises';
import path from 'path';
import { CWD } from '../utils/projectRoot.js';
import { Language } from '../types/common.js';
import { getLogger } from '../classes/Logger.js';

const logger = getLogger();

type Translations = Record<string, string>;

/**
 * Load translations from the locales folder
 * @param language - language of the translations
 * @returns - translations
 */
export async function loadTranslations(language: Language): Promise<Translations> {
  try {
    const filePath = path.join(CWD, 'locales', `${language}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as Translations;
  } catch (error) {
    logger.error(`[utils/loadTranslations] language = ${language}, error = ${error}`);
    return {};
  }
}