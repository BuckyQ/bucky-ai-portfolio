export const AI_CONFIG = {
  maxQuestionLength: 400,
  sessionQuestionLimit: 3,
  dailyIpLimit: 10,
  dailyIpWindowSeconds: 24 * 60 * 60,
  transcriptionDailyIpLimit: 10,
  transcriptionModel: "gpt-4o-mini-transcribe",
  maxRecordingSeconds: 30,
  maxAudioBytes: 5 * 1024 * 1024,
  maxFileBytes: 5 * 1024 * 1024,
  maxExtractedCharacters: 50_000,
  temporaryDocumentTopK: 3,
  temporaryDocumentChunkSize: 1_200,
  temporaryDocumentChunkOverlap: 160,
  operationLockSeconds: 60,
  retrievalTopK: 4,
  similarityThreshold: 0.28,
  answerModel: "gpt-4o-mini",
  maxAnswerTokens: 300,
  maxAnswerWords: 200,
} as const;

export const OUT_OF_SCOPE_MESSAGE =
  "I can only answer questions about Bucky's professional experience, projects, skills, and education.";

export const INSUFFICIENT_PROFILE_MESSAGE =
  "I don't have enough information in Bucky's public profile to answer that yet.";

export const DAILY_LIMIT_MESSAGE =
  "You've reached today's AI demo limit. You can still explore Bucky's projects, GitHub, and experience.";
