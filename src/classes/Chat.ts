import dotenv from 'dotenv';
import TelegramBot, { SendMessageOptions, EditMessageTextOptions, Message } from 'node-telegram-bot-api';
import { getLogger } from './Logger.js';
import { Language } from '../types/common.js';
import { loadTranslations } from '../utils/loadTranslations.js';
dotenv.config();
const logger = getLogger();

type Translations = Record<string, string>;

export class Chat {
  private translations: Translations = {};

  constructor(
    private bot: TelegramBot,
    private chatId: number,
    private language: Language,
  ) {
    this.initTranslations();
  }

  private createCallbackData(command: string, lang: Language): string {
    return `${command}\t${lang}`;
  }

  private async initTranslations() {
    this.translations = await loadTranslations(this.language);
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
   * @param language - language of the message
   * @param start - true if the bot starts, false if the user changes the language
   * @returns - message
   */
  async languagesList(start: boolean): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/languagesList] chatId = ${this.chatId}, language = ${this.language}, start = ${start}`
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
   * @param language - language of the message
   * @returns - message
   */
  // async technicalIssue(language: Language): Promise<Message | null> {
  //   try {
  //     logger.debug(`[classes/Chat/technicalIssue] chatId = ${this.chatId}, language = ${language}`);
  //     const messages = {
  //       english: '⚠️\nWe are sorry, but we have temporary technical difficulties.\nTry again later.',
  //       spanish: '⚠️\nLo sentimos, pero tenemos dificultades técnicas temporales.\nInténtalo de nuevo más tarde.',
  //       french:
  //         '⚠️\nNous sommes désolés, mais nous rencontrons des difficultés techniques temporaires.\n' +
  //         'Réessayez plus tard.',
  //       russian: '⚠️\nСожалеем, но у нас временные технические сложности.\nПопробуйте позже.',
  //     };
  //     const options: SendMessageOptions = {
  //       parse_mode: 'HTML',
  //       // reply_markup: {
  //       //   keyboard: this.keyboardStandart[language],
  //       //   resize_keyboard: true,
  //       //   one_time_keyboard: false,
  //       // },
  //     };
  //     return await this.bot.sendMessage(this.chatId, messages[language], options);
  //   } catch (error: unknown) {
  //     logger.error(`[classes/Chat/technicalIssue] chatId = ${this.chatId}language = ${language}, error = ${error}`);
  //     return null;
  //   }
  // }

}
