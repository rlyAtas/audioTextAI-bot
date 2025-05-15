FROM node:22.15.0-slim

# Дополнительно нужны модули для конвертации аудио
RUN apt-get update && apt-get install -y \
  build-essential \
  ffmpeg \
  cmake \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Загрузка модели large-v3-turbo для транскрибации
COPY models/ggml-large-v3-turbo.bin node_modules/nodejs-whisper/cpp/whisper.cpp/models/

RUN npm run build

ENV NODE_ENV=development

CMD ["node", "dist/index.js"]
