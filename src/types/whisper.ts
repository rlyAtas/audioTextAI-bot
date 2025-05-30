export const whisperModels = ['tiny', 'base', 'small', 'medium', 'large-v3-turbo'] as const;

export type WhisperModel = (typeof whisperModels)[number];

export const defaultWhisperModel: WhisperModel = whisperModels[whisperModels.length - 1];

export function isValidWhisperModel(model: string): model is WhisperModel {
  return whisperModels.includes(model as WhisperModel);
}

export function getWhisperModels(): readonly WhisperModel[] {
  return whisperModels;
}
