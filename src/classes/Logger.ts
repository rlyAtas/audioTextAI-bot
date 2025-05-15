import dotenv from 'dotenv';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { CWD } from '../utils/projectRoot.js';

dotenv.config();

type TransportsConfig = {
  console: transports.ConsoleTransportInstance;
  file: DailyRotateFile;
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

let logger: Logger | undefined;

export function getLogger(): Logger {
  if (!logger) {
    logger = createLogger({
      transports: [Transports.console, Transports.file],
    });
  }
  return logger;
}
