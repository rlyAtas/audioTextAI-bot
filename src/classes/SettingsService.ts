import { PrismaClient, AppSetting } from '@prisma/client';
import { getLogger } from './Logger.js';

const logger = getLogger();

/**
 * Сервис для управления настройками приложения
 */
export class SettingsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Получить значение настройки по ключу
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      logger.debug(`[classes/SettingsService/getSetting] key = ${key}`);
      const setting = await this.prisma.appSetting.findUnique({
        where: { key },
      });
      return setting?.value || null;
    } catch (error: unknown) {
      logger.error(`[classes/SettingsService/getSetting] key = ${key}, error = ${error}`);
      return null;
    }
  }

  /**
   * Установить значение настройки
   */
  async setSetting(key: string, value: string, description?: string): Promise<boolean> {
    try {
      logger.debug(`[classes/SettingsService/setSetting] key = ${key}, value = ${value}`);
      await this.prisma.appSetting.upsert({
        where: { key },
        update: {
          value,
          ...(description && { description }),
          updatedAt: new Date(),
        },
        create: {
          key,
          value,
          description: description || `Setting: ${key}`,
        },
      });

      logger.info(`Setting updated: ${key} = ${value}`);
      return true;
    } catch (error) {
      logger.error(
        `[classes/SettingsService/setSetting] key = ${key}, value = ${value}, error = ${error}`,
      );
      return false;
    }
  }
}
