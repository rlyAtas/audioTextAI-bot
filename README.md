# AudioTextAIBot 🎙️➡️📝

AudioTextAIBot — это Telegram-бот на Node.js, который принимает голосовые сообщения и аудиофайлы и преобразует их в текст с помощью локальной модели Whisper.  
Бот поддерживает множество языков, имеет многоязычный интерфейс и может быть полезен для изучающих языки, журналистов, студентов и всех, кому нужно быстро расшифровать аудио.

## 🚀 Основные возможности

- Прием аудио (voice, audio, document) от пользователя в форматах: mp3, wav, ogg, m4a, aac, flac
- Автоматическая транскрибация через локальную модель Whisper
- Поддержка множества языков с автоопределением
- Многоязычный интерфейс (русский, английский, немецкий, французский, испанский, арабский, украинский)
- Отправка текста прямо в Telegram

## 🛠️ Технологии

- **Backend**: Node.js + TypeScript
- **Bot API**: Telegram Bot API (`node-telegram-bot-api`)
- **AI**: Whisper (локальная установка через whisper.cpp)
- **База данных**: SQLite + Prisma ORM
- **Логирование**: Winston с ротацией файлов
- **Контейнеризация**: Docker + Docker Compose
- **Код-стиль**: ESLint + Prettier
- **Разработка**: Nodemon, ts-node

## 📋 Требования

- Node.js >= 20.0.0
- FFmpeg (для конвертации аудио)
- CMake и build-essential (для компиляции whisper.cpp)
- Whisper.cpp и модели

## 🎯 Установка Whisper.cpp

Перед запуском бота необходимо установить whisper.cpp и загрузить модели.

### macOS

```bash
# Установка зависимостей через Homebrew
brew install cmake ffmpeg

# Клонирование и сборка whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make

# Загрузка модели (выберите нужную)
bash ./models/download-ggml-model.sh large-v3-turbo
```

### Ubuntu/Debian

```bash
# Установка зависимостей
sudo apt update
sudo apt install build-essential cmake ffmpeg

# Клонирование и сборка whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make

# Загрузка модели (выберите нужную)
bash ./models/download-ggml-model.sh large-v3-turbo
```

### Docker (автоматическая установка)

При использовании Docker whisper.cpp устанавливается автоматически в контейнере.

### Доступные модели

| Модель           | Размер | Скорость     | Качество     | Рекомендации              |
| ---------------- | ------ | ------------ | ------------ | ------------------------- |
| `tiny`           | 39 MB  | Очень быстро | Базовое      | Тестирование              |
| `base`           | 74 MB  | Быстро       | Хорошее      | Простые задачи            |
| `small`          | 244 MB | Умеренно     | Хорошее      | Обычное использование     |
| `medium`         | 769 MB | Медленно     | Отличное     | Качественная транскрипция |
| `large-v3-turbo` | 809 MB | Медленно     | Превосходное | **Рекомендуется**         |

### Настройка переменных окружения

После установки whisper.cpp настройте переменные в `.env`:

```bash
# Путь к исполняемому файлу whisper
WHISPER_PATH=/usr/local/bin/whisper  # Linux
# или
WHISPER_PATH=/path/to/whisper.cpp/main  # macOS (локальная сборка)

# Количество потоков для обработки (рекомендуется: количество ядер CPU)
WHISPER_THREADS=4

```

## ⚙️ Установка

### 🔧 Запуск

1. **Клонируйте репозиторий:**

```bash
git clone https://github.com/rlyAtas/audioTextAI.git
cd AudioTextDEBot
```

2. **Установите зависимости:**

```bash
npm install
```

3. **Настройте переменные окружения:**

Отредактируйте `.env` файл

```bash
cp .env.example .env
```

4. **Инициализируйте базу данных:**

```bash
npx prisma generate
npx prisma migrate deploy
```

5. **Соберите и запустите проект:**

```bash
npm run build
npm start
```

### 🐳 Docker запуск

1. **Соберите и запустите контейнер:**

```bash
docker build -t audiotextdebot .
docker run -d \
  --name audiotextdebot \
  -p 3000:3000 \
  -e BOT_TOKEN=your_bot_token \
  -e DATABASE_URL="file:./prisma/prod.db" \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/texts:/app/texts \
  -v $(pwd)/log:/app/log \
  audiotextdebot
```

## 📱 Использование

### Команды бота

- `/start` - Начать работу с ботом и выбрать язык интерфейса
- `/help` - Показать справку по использованию

### Отправка аудио

1. Запишите голосовое сообщение в Telegram
2. Отправьте аудиофайл (поддерживаются: mp3, wav, ogg, m4a, aac, flac)
3. Дождитесь обработки (время зависит от длительности аудио)
4. Получите текст в чате или скачайте как файл

### Поддерживаемые форматы

- **Голосовые сообщения Telegram** (ogg)
- **Аудиофайлы**: mp3, wav, ogg, m4a, aac, flac
- **Максимальный размер**: ограничен лимитами Telegram (20MB для файлов)

## 🌍 Многоязычность

Бот поддерживает следующие языки интерфейса:

- 🇷🇺 Русский
- 🇺🇸 Английский
- 🇩🇪 Немецкий
- 🇫🇷 Французский
- 🇪🇸 Испанский
- 🇸🇦 Арабский
- 🇺🇦 Украинский

Переводы находятся в `src/locales/`. Для добавления нового языка:

1. Создайте файл `src/locales/newlang.json`
2. Скопируйте структуру из `english.json`
3. Переведите все строки
4. Добавьте язык в список в боте

---

**AudioTextDEBot** - Превращаем голос в текст с помощью ИИ! 🚀
