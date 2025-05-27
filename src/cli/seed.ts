import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Создаем базовые настройки приложения
  const settings = [
    {
      key: 'current_whisper_model',
      value: 'large-v3-turbo',
      description: 'Currently active Whisper model for transcriptions',
    },
  ];

  console.log('🌱 Seeding app settings...');

  for (const setting of settings) {
    // Проверяем, существует ли настройка
    const existingSetting = await prisma.appSetting.findUnique({
      where: { key: setting.key },
    });

    if (existingSetting) {
      console.log(`⏭️  Setting already exists: ${setting.key} = ${existingSetting.value}`);
    } else {
      await prisma.appSetting.create({
        data: setting,
      });
      console.log(`✅ Created setting: ${setting.key} = ${setting.value}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
