import fs from 'fs/promises';
import path from 'path';
import { CWD } from '../utils/projectRoot.js';
import dotenv from 'dotenv';
import TelegramBot, {
  SendMessageOptions,
  EditMessageTextOptions,
  Message,
  SendDocumentOptions,
} from 'node-telegram-bot-api';
import { getLogger } from './Logger.js';
import { Language } from '../types/common.js';

dotenv.config();
const logger = getLogger();

type Translations = Record<string, string>;
const translationCache = new Map<Language, Translations>();

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

  private createCallbackData(command: string, parameter: string): string {
    return `${command}_${parameter}`;
  }

  private async initTranslations() {
    try {
      logger.debug(
        `[classes/Chat/initTranslations] chatId = ${this.chatId}, language = ${this.language}`,
      );

      if (!translationCache.has(this.language)) {
        const filePath = path.join(CWD, 'src/locales', `${this.language}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const translations = JSON.parse(fileContent) as Translations;
        translationCache.set(this.language, translations);
      }

      this.translations = translationCache.get(this.language)!;
    } catch (error) {
      logger.error(
        `[classes/Chat/loadTranslations] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
    }
  }

  private t(key: string, values?: Record<string, string>): string {
    let message = this.translations[key] || key;
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }
    return message;
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
        `[classes/Chat/languagesList] chatId = ${this.chatId}, language = ${this.language}` +
          `, start = ${start}`,
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
        `[classes/Chat/languagesList] chatId = ${this.chatId}, language = ${this.language}` +
          `, start = ${start}` +
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
        `[classes/Chat/technicalIssue] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
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

  /**
   * Message that the audio format is not yet supported
   * @returns - message
   */
  async unsupportedFormat(): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/unsupportedFormat] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return this.bot.sendMessage(this.chatId, this.t('unsupportedFormat'), options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/unsupportedFormat] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Send help message with bot information and usage instructions
   * @returns - message
   */
  async sendHelp(): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/sendHelp] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, this.t('help'), options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/sendHelp] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * The message sends the user the result of the transcription
   * @param file - path to the file
   * @param previewText - text preview
   * @param languageCode - language code
   * @returns - message
   */
  async transcribeResult(file: string, previewText: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/transcriptionResult] chatId = ${this.chatId}, language = ${this.language}` +
          `, file = ${file}, previewText = ${previewText.trim()}`,
      );
      const callbackData = this.createCallbackData('download', file);
      const options: SendMessageOptions = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: this.t('buttonTranscribeResult'), callback_data: callbackData }],
          ],
        },
      };
      return await this.bot.sendMessage(
        this.chatId,
        this.t('transcribeResult', { previewText }),
        options,
      );
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/transcriptionResult] chatId = ${this.chatId}, language = ${this.language}` +
          `, file = ${file}, previewText = ${previewText}` +
          `, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * The message returns a file with the transcription result.
   * @param file - path to the file
   * @returns - message
   */
  async transcribeDownload(file: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/transcribeDownload] chatId = ${this.chatId}, language = ${this.language}`,
      );
      const options: SendDocumentOptions = {
        caption: this.t('transcribeDownload'),
        parse_mode: 'HTML',
      };
      return await this.bot.sendDocument(this.chatId, file, options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/transcribeDownload] chatId = ${this.chatId}, language = ${this.language}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Сообщение об ошибке при установке недоступной модели
   * @param modelName - название модели
   * @param availableModels - список доступных моделей
   * @returns - message
   */
  async modelNotAvailable(modelName: string, availableModels: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/modelNotAvailable] chatId = ${this.chatId}, language = ${this.language}, modelName = ${modelName}`,
      );

      const errorMessages = {
        russian: `Модель "${modelName}" недоступна.\nДоступные модели: ${availableModels}`,
        english: `Model "${modelName}" is not available.\nAvailable models: ${availableModels}`,
        deutsch: `Modell "${modelName}" ist nicht verfügbar.\nVerfügbare Modelle: ${availableModels}`,
        ukrainian: `Модель "${modelName}" недоступна.\nДоступні моделі: ${availableModels}`,
        spanish: `El modelo "${modelName}" no está disponible.\nModelos disponibles: ${availableModels}`,
        french: `Le modèle "${modelName}" n'est pas disponible.\nModèles disponibles: ${availableModels}`,
        arabic: `النموذج "${modelName}" غير متاح.\nالنماذج المتاحة: ${availableModels}`,
      };

      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, errorMessages[this.language], options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/modelNotAvailable] chatId = ${this.chatId}, language = ${this.language}, modelName = ${modelName}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Сообщение об успешной установке модели
   * @param modelName - название модели
   * @returns - message
   */
  async modelSetSuccess(modelName: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/modelSetSuccess] chatId = ${this.chatId}, language = ${this.language}, modelName = ${modelName}`,
      );

      const successMessages = {
        russian: `Модель Whisper изменена на: ${modelName}`,
        english: `Whisper model set to: ${modelName}`,
        deutsch: `Whisper-Modell auf ${modelName} gesetzt`,
        ukrainian: `Модель Whisper змінена на: ${modelName}`,
        spanish: `Modelo Whisper configurado a: ${modelName}`,
        french: `Modèle Whisper défini sur: ${modelName}`,
        arabic: `تم تعيين نموذج Whisper إلى: ${modelName}`,
      };

      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, successMessages[this.language], options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/modelSetSuccess] chatId = ${this.chatId}, language = ${this.language}, modelName = ${modelName}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Сообщение со списком доступных моделей
   * @param models - массив доступных моделей
   * @param currentModel - текущая модель
   * @returns - message
   */
  async modelsList(models: readonly string[], currentModel: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/modelsList] chatId = ${this.chatId}, language = ${this.language}, currentModel = ${currentModel}`,
      );

      const headers = {
        russian: '<b>Доступные модели Whisper:</b>\n\n',
        english: '<b>Available Whisper models:</b>\n\n',
        deutsch: '<b>Verfügbare Whisper-Modelle:</b>\n\n',
        ukrainian: '<b>Доступні моделі Whisper:</b>\n\n',
        spanish: '<b>Modelos Whisper disponibles:</b>\n\n',
        french: '<b>Modèles Whisper disponibles:</b>\n\n',
        arabic: '<b>نماذج Whisper المتاحة:</b>\n\n',
      };

      const footers = {
        russian: `\n<b>Текущая модель:</b> ${currentModel}`,
        english: `\n<b>Current model:</b> ${currentModel}`,
        deutsch: `\n<b>Aktuelles Modell:</b> ${currentModel}`,
        ukrainian: `\n<b>Поточна модель:</b> ${currentModel}`,
        spanish: `\n<b>Modelo actual:</b> ${currentModel}`,
        french: `\n<b>Modèle actuel:</b> ${currentModel}`,
        arabic: `\n<b>النموذج الحالي:</b> ${currentModel}`,
      };

      let message = headers[this.language];
      models.forEach((modelName) => {
        message += `${modelName}\n`;
      });
      message += footers[this.language];

      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };
      return await this.bot.sendMessage(this.chatId, message, options);
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/modelsList] chatId = ${this.chatId}, language = ${this.language}, currentModel = ${currentModel}, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * The method informs the user that the file has been received and added to the processing queue.
   * @param fileName - name of the audio file
   * @param duration - duration in seconds
   * @returns - message
   */
  async transcribeFileReceived(fileName: string, duration: string): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/transcribeFileReceived] chatId = ${this.chatId}, language = ${this.language}` +
          `, fileName = ${fileName}, duration = ${duration}`,
      );

      const options: SendMessageOptions = {
        parse_mode: 'HTML',
      };

      return this.bot.sendMessage(
        this.chatId,
        this.t('transcribeFileReceived', { fileName, duration }),
        options,
      );
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/transcribeFileReceived] chatId = ${this.chatId}, language = ${this.language}` +
          `, fileName = ${fileName}, duration = ${duration}` +
          `, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * The method informs the user that processing has started (audio conversion).
   * @param messageId - ID of the message to edit
   * @param fileName - name of the audio file
   * @param duration - duration in seconds
   * @returns - message
   */
  async transcribeProcessingStart(
    messageId: number,
    fileName: string,
    duration: string,
  ): Promise<Message | null> {
    try {
      logger.debug(
        '[classes/Chat/transcribeProcessingStart]' +
          ` chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}`,
      );

      const options: EditMessageTextOptions = {
        chat_id: this.chatId,
        message_id: messageId,
        parse_mode: 'HTML',
      };

      const result = await this.bot.editMessageText(
        this.t('transcribeProcessingStart', { fileName, duration }),
        options,
      );

      return typeof result === 'boolean' ? null : result;
    } catch (error: unknown) {
      logger.error(
        '[classes/Chat/transcribeProcessingStart]' +
          ` chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}` +
          `, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Update the processing message with progress information.
   * @param messageId - ID of the message to edit
   * @param fileName - name of the audio file
   * @param duration - duration in seconds
   * @param progress - progress percentage (0-100)
   * @returns - edited message
   */
  async transcribeProgressUpdate(
    messageId: number,
    fileName: string,
    duration: string,
    progress: number,
  ): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/transcribeProgressUpdate] chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}, progress = ${progress}`,
      );

      const options: EditMessageTextOptions = {
        chat_id: this.chatId,
        message_id: messageId,
        parse_mode: 'HTML',
      };

      const result = await this.bot.editMessageText(
        this.t('transcribeProgress', { progress: progress.toString(), fileName, duration }),
        options,
      );

      return typeof result === 'boolean' ? null : result;
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/transcribeProgressUpdate] chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}, progress = ${progress}`,
        `, error = ${error}`,
      );
      return null;
    }
  }

  /**
   * Update the processing message with completion information.
   * @param messageId - ID of the message to edit
   * @param fileName - name of the audio file
   * @param duration - duration in seconds
   * @param languageCode - detected language code
   * @returns - edited message
   */
  async transcribeCompleted(
    messageId: number,
    fileName: string,
    duration: string,
    languageCode: string,
  ): Promise<Message | null> {
    try {
      logger.debug(
        `[classes/Chat/transcribeCompleted] chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}, languageCode = ${languageCode}`,
      );

      const result = await this.bot.editMessageText(
        this.t('transcribeCompleted', { fileName, duration, languageCode }),
        {
          chat_id: this.chatId,
          message_id: messageId,
          parse_mode: 'HTML',
        },
      );

      return typeof result === 'boolean' ? null : result;
    } catch (error: unknown) {
      logger.error(
        `[classes/Chat/transcribeCompleted] chatId = ${this.chatId}, language = ${this.language}` +
          `, messageId = ${messageId}, fileName = ${fileName}, duration = ${duration}, languageCode = ${languageCode}` +
          `, error = ${error}`,
      );
      return null;
    }
  }
}
