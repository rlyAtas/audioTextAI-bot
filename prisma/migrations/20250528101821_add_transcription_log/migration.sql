-- CreateTable
CREATE TABLE "transcription_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "whisperModel" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "detectedLang" TEXT,
    "textLength" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "transcription_logs_whisperModel_idx" ON "transcription_logs"("whisperModel");

-- CreateIndex
CREATE INDEX "transcription_logs_createdAt_idx" ON "transcription_logs"("createdAt");

-- CreateIndex
CREATE INDEX "transcription_logs_success_idx" ON "transcription_logs"("success");
