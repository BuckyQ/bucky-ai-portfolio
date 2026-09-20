import "server-only";

import {
  AI_CONFIG,
  INSUFFICIENT_PROFILE_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
} from "@/config/ai";
import type { UnansweredReason } from "@/lib/unanswered-questions";

import { getOpenAIClient } from "./embedding";
import { analyzeQuestionScope } from "./question-scope";
import { retrieveChunks, type RetrievedChunk } from "./retrieve";

interface UnansweredFeedback {
  reason: UnansweredReason;
  topScore?: number;
}

interface AnsweredRagAnswer {
  status: "answered";
  answer: string;
  sources: RetrievedChunk[];
}

interface RejectedRagAnswer {
  status: "rejected";
  code: "INSUFFICIENT_CONTEXT" | "OUT_OF_SCOPE";
  answer: string;
  sources: [];
  feedback?: UnansweredFeedback;
}

export type RagAnswer = AnsweredRagAnswer | RejectedRagAnswer;

const insufficientContextAnswer =
  "I don't have that information in Bucky's public profile.";

function isInsufficientContextAnswer(answer: string): boolean {
  const normalizedAnswer = answer
    .trim()
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(/[.!]+$/, "");
  const normalizedFallback = insufficientContextAnswer
    .toLowerCase()
    .replace(/[.!]+$/, "");

  return normalizedAnswer === normalizedFallback;
}

export async function generateAnswer(
  question: string,
  sources: RetrievedChunk[],
): Promise<string> {
  if (sources.length === 0) return insufficientContextAnswer;

  const context = sources
    .map(
      (source) =>
        `[${source.metadata.title} / ${source.id}]\n${source.text}`,
    )
    .join("\n\n");

  const response = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL ?? AI_CONFIG.answerModel,
    temperature: 0,
    max_tokens: AI_CONFIG.maxAnswerTokens,
    messages: [
      {
        role: "system",
        content: `You are Bucky Qian's portfolio assistant.

Answer only using the supplied context about Bucky.

Do not invent information.

If the provided context does not contain enough information to answer the question, say:

"I don't have that information in Bucky's public profile."

Only answer questions about Bucky's professional background, projects, technical skills, education, and career experience.

Keep the answer direct, concise, and no longer than ${AI_CONFIG.maxAnswerWords} words.

Use plain text without Markdown formatting.`,
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${question}`,
      },
    ],
  });

  return response.choices[0]?.message.content?.trim() || insufficientContextAnswer;
}

export async function answerQuestion(question: string): Promise<RagAnswer> {
  const scope = analyzeQuestionScope(question);
  const candidates = await retrieveChunks(question, {
    topK: AI_CONFIG.retrievalTopK,
  });
  const highestScore = candidates[0]?.score ?? 0;

  if (candidates.length === 0) {
    return {
      status: "rejected",
      code: scope.isProfessionalQuestion
        ? "INSUFFICIENT_CONTEXT"
        : "OUT_OF_SCOPE",
      answer: scope.isProfessionalQuestion
        ? INSUFFICIENT_PROFILE_MESSAGE
        : OUT_OF_SCOPE_MESSAGE,
      sources: [],
      feedback: scope.isSafeToStore
        ? { reason: "no_results" }
        : undefined,
    };
  }

  if (highestScore < AI_CONFIG.similarityThreshold) {
    return {
      status: "rejected",
      code: scope.isProfessionalQuestion
        ? "INSUFFICIENT_CONTEXT"
        : "OUT_OF_SCOPE",
      answer: scope.isProfessionalQuestion
        ? INSUFFICIENT_PROFILE_MESSAGE
        : OUT_OF_SCOPE_MESSAGE,
      sources: [],
      feedback: scope.isSafeToStore
        ? { reason: "low_similarity", topScore: highestScore }
        : undefined,
    };
  }

  if (!scope.isProfessionalQuestion) {
    return {
      status: "rejected",
      code: "OUT_OF_SCOPE",
      answer: OUT_OF_SCOPE_MESSAGE,
      sources: [],
    };
  }

  const sources = candidates.filter(
    (source) => source.score >= AI_CONFIG.similarityThreshold,
  );
  const answer = await generateAnswer(question, sources);

  if (isInsufficientContextAnswer(answer)) {
    return {
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      answer,
      sources: [],
      feedback: scope.isSafeToStore
        ? { reason: "missing_profile_info", topScore: highestScore }
        : undefined,
    };
  }

  return { status: "answered", answer, sources };
}
