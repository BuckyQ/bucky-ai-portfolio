import "server-only";

import { createHmac } from "node:crypto";

export interface AnswerCacheKeyContext {
  answerModel: string;
  profileSourceHash: string;
  promptVersion: string;
  retrievalVersion: string;
  secret: string;
}

export function normalizeAnswerCacheQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("’", "'")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?!.]+$/g, "")
    .trim();
}

export function createAnswerCacheKey(
  question: string,
  context: AnswerCacheKeyContext,
): string {
  const normalizedQuestion = normalizeAnswerCacheQuestion(question);
  if (!normalizedQuestion || !context.secret) {
    throw new Error("Answer-cache key input is invalid.");
  }

  const payload = JSON.stringify({
    answerModel: context.answerModel,
    profileSourceHash: context.profileSourceHash,
    promptVersion: context.promptVersion,
    question: normalizedQuestion,
    retrievalVersion: context.retrievalVersion,
  });
  const digest = createHmac("sha256", context.secret)
    .update(payload)
    .digest("hex");

  return `v1:${digest}`;
}
