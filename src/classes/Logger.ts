import dotenv from 'dotenv';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import TelegramLogger from 'winston-telegram';
import path from 'path';
import { CWD } from '../utils/projectRoot.js';

dotenv.config();

type TransportsConfig = {
  console: transports.ConsoleTransportInstance;
  file: DailyRotateFile;
  telegram?: TelegramLogger;
};

export const Transports: TransportsConfig = {
  console: new transports.Console({
    level: process.env.LOG_LEVEL_CONSOLE || 'info',
    format: format.combine(
      format.colorize(),
      format.printf((info) => `${info.level} ${String(info.message).trim()}`),
    ),
  }),
  file: new DailyRotateFile({
    level: process.env.LOG_LEVEL_FILE || 'info',
    filename: path.join(CWD, 'log', '%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(
        (info) => `${info.timestamp} ${info.level.toUpperCase()} ${String(info.message).trim()}`,
      ),
    ),
  }),
};

// Добавляем Telegram транспорт если настроен
if (process.env.INFOBOT_TOKEN && process.env.ADMIN_TELEGRAM_ID) {
  Transports.telegram = new TelegramLogger({
    token: process.env.INFOBOT_TOKEN,
    chatId: parseInt(process.env.ADMIN_TELEGRAM_ID, 10),
    level: 'info',
    unique: true,
    silent: false,
    disableNotification: false,
    parseMode: 'HTML', // Важно! Включаем обработку HTML тегов
    template: '{level} {message}',
    formatMessage: (options) => {
      const level = options.level.toUpperCase();
      const message = options.message;

      // Определяем окружение и префикс
      const environment = process.env.NODE_ENV || 'development';
      const envPrefix = environment === 'production' ? '🟢 PROD' : '🟡 DEV';

      // Добавляем эмодзи в зависимости от уровня
      const emoji = level === 'ERROR' ? '❌' : level === 'INFO' ? 'ℹ️' : '📝';

      return `${envPrefix} ${emoji} <b>${level}</b>\n${message}`;
    },
  });
}

let logger: Logger | undefined;

export function getLogger(): Logger {
  if (!logger) {
    const availableTransports: any[] = [Transports.console, Transports.file];

    // Добавляем Telegram транспорт если он настроен
    if (Transports.telegram) {
      availableTransports.push(Transports.telegram);
    }

    logger = createLogger({
      transports: availableTransports,
    });
  }
  return logger;
}
