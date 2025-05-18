import fs from 'fs/promises';
import path from 'path';
import { CWD } from '../utils/projectRoot.js';
import dotenv from 'dotenv';
import TelegramBot, {
  SendMessageOptions,
  EditMessageTextOptions,
  Message,
} from 'node-telegram-bot-api';
import { getLogger } from './Logger.js';
import { Language } from '../types/common.js';
dotenv.config();
const logger = getLogger();

type Translations = Record<string, string>;

export class Chat {
  private translations: Translations = {};

  constructor(
    private bot: TelegramBot,
    private chatId: number,
    private language: Language,
  ) {}

  static async create(bot: TelegramBot, chatId: number, language: Language): Promise<Chat> {
    const instance = new Chat(bot, chatId, language);
    await instance.initTranslations();
    return instance;
  }

  private createCallbackData(command: string, lang: Language): string {
    return `${command}_${lang}`;
  }

  private async initTranslations() {
    try {
      logger.debug(
        `[classes/Chat/initTranslations] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const filePath = path.join(CWD, 'src/locales', `${this.language}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      this.translations = JSON.parse(fileContent) as Translations;
    } catch (error) {
      logger.error(
        `[classes/Chat/loadTranslations] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
      return {};
    }
  }

  private t(key: string): string {
    return this.translations[key] || key;
  }

  /**
   * Greeting message
   * @returns - message
   */
  async hi(): Promise<Message | null> {
    try {
      logger.debug(`[classes/Chat/hi] chatId = ${this.chatId}, language = ${this.language}`);
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, this.t('hi'), options);
    } catch (error: unknown) {
      logger.error(`[classes/Chat/hi] chatId = ${this.chatId}, error = ${error}`);
      return null;
    }
  }

  /**
   * Message with buttons for select a language when the bot starts
   * @param start - true if the bot starts, false if the user changes the language
   * @returns - message
   */
  async languagesList(start: boolean): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/languagesList] chatId = ${this.chatId}, language = ${this.language}, start = ${start}`,
      );
      const command = start ? 'startLanguageSet' : 'languageSet';
      const inlineButtons = [
        [{ text: '🇷🇺 Русский', callback_data: this.createCallbackData(command, 'russian') }],
        [{ text: '🇬🇧 English', callback_data: this.createCallbackData(command, 'english') }],
        [{ text: '🇩🇪 Deutsch', callback_data: this.createCallbackData(command, 'deutsch') }],
        [{ text: '🇺🇦 Українська', callback_data: this.createCallbackData(command, 'ukrainian') }],
        [{ text: '🇪🇸 Español', callback_data: this.createCallbackData(command, 'spanish') }],
        [{ text: '🇫🇷 Français', callback_data: this.createCallbackData(command, 'french') }],
        [{ text: '🇸🇦 العربية', callback_data: this.createCallbackData(command, 'arabic') }],
      ];
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineButtons,
        },
      };
      return await this.bot.sendMessage(this.chatId, this.t('languagesList'), options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/languagesList] chatId = ${this.chatId}, language = ${this.language}, start = ${start}` +
          `, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Message about technical issues
   * @returns - message
   */
  async technicalIssue(): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/technicalIssue] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, this.t('technicalIssue'), options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/technicalIssue] chatId = ${this.chatId}language = ${this.language}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Message that the user language is set. Shown at startup
   * @returns - message
   */
  async startLanguageSet(): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/startLanguageSet] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, this.t('startLanguageSet'), options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/startLanguageSet] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
      return null;
    }
  }
}
