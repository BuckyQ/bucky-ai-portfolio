import { after } from "next/server";

import {
  AI_CONFIG,
  ANSWER_PENDING_MESSAGE,
  DAILY_LIMIT_MESSAGE,
} from "@/config/ai";
import {
  prepareAnswerCache,
  type AnswerCacheLease,
} from "@/lib/answer-cache";
import type { CachedAnswerSource } from "@/lib/answer-cache-core";
import type { TemporaryDocument } from "@/lib/files/types";
import {
  DocumentInputError,
  validateTemporaryDocument,
} from "@/lib/files/validate-file";
import {
  reserveAiQuestion,
  type RateLimitReservation,
} from "@/lib/rate-limit";
import { getDirectResponse } from "@/lib/rag/direct-response";
import { answerQuestion } from "@/lib/rag/generate";
import { getOfflineProfileResponse } from "@/lib/rag/offline-response";
import type { RetrievedChunk } from "@/lib/rag/retrieve";
import { safelySaveUnansweredQuestion } from "@/lib/unanswered-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

interface PublicAnswerSource {
  id: string;
  title: string;
  type: "bucky-profile" | "uploaded-document";
  score: number;
}

function serializeSources(sources: RetrievedChunk[]): PublicAnswerSource[] {
  return sources.map((source) => ({
    id: source.id,
    title:
      source.metadata.sourceType === "uploaded-document"
        ? `Uploaded Document: ${source.metadata.fileName}`
        : `Bucky Profile: ${source.metadata.title}`,
    type:
      source.metadata.sourceType === "uploaded-document"
        ? "uploaded-document"
        : "bucky-profile",
    score: Number(source.score.toFixed(4)),
  }));
}

function cacheableSources(
  sources: PublicAnswerSource[],
): CachedAnswerSource[] {
  return sources.flatMap((source): CachedAnswerSource[] =>
    source.type === "bucky-profile"
      ? [
          {
            id: source.id,
            title: source.title,
            type: "bucky-profile",
            score: source.score,
          },
        ]
      : [],
  );
}

function offlineAnswerResponse(question: string): Response | null {
  const fallback = getOfflineProfileResponse(question);
  if (!fallback) return null;

  return json({
    answer: fallback.answer,
    answerMode: "offline",
    countsTowardLimit: true,
    sources: [],
  });
}

async function safelyReleaseCacheLease(
  lease: AnswerCacheLease | undefined,
): Promise<void> {
  if (!lease) return;

  try {
    await lease.release();
  } catch {
    console.error("Ask Bucky answer-cache lease could not be released.");
  }
}

async function safelyReleaseRateLimit(
  reservation: RateLimitReservation | undefined,
): Promise<void> {
  if (!reservation?.allowed) return;

  try {
    await reservation.release();
  } catch {
    console.error("Ask Bucky rate-limit reservation could not be released.");
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? (body as { question?: unknown }).question
      : undefined;
  let temporaryDocument: TemporaryDocument | undefined;

  if (typeof question !== "string") {
    return json({ error: "Please provide a question." }, { status: 400 });
  }

  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    return json({ error: "Please provide a question." }, { status: 400 });
  }

  if (normalizedQuestion.length > AI_CONFIG.maxQuestionLength) {
    return json(
      {
        error: `Questions must be ${AI_CONFIG.maxQuestionLength} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "temporaryDocument" in body &&
    (body as { temporaryDocument?: unknown }).temporaryDocument !== undefined
  ) {
    try {
      temporaryDocument = validateTemporaryDocument(
        (body as { temporaryDocument: unknown }).temporaryDocument,
      );
    } catch (error) {
      if (error instanceof DocumentInputError) {
        return json(
          { error: error.message, code: error.code },
          { status: error.status },
        );
      }
      return json({ error: "The temporary document is invalid." }, { status: 400 });
    }
  }

  const directResponse = getDirectResponse(normalizedQuestion);

  if (directResponse) {
    return json({
      answer: directResponse.answer,
      answerMode: "direct",
      countsTowardLimit: false,
      sources: [],
    });
  }

  let cacheLease: AnswerCacheLease | undefined;
  let reservation: RateLimitReservation | undefined;

  try {
    if (!temporaryDocument) {
      try {
        const preparedCache = await prepareAnswerCache(normalizedQuestion);

        if (preparedCache.status === "hit") {
          return json({
            answer: preparedCache.value.answer,
            answerMode: "cache",
            countsTowardLimit: true,
            sources: preparedCache.value.sources,
          });
        }

        if (preparedCache.status === "busy") {
          const offlineResponse = offlineAnswerResponse(normalizedQuestion);
          if (offlineResponse) return offlineResponse;

          return json(
            { error: ANSWER_PENDING_MESSAGE, code: "ANSWER_PENDING" },
            { status: 503, headers: { "Retry-After": "2" } },
          );
        }

        if (preparedCache.status === "owner") {
          cacheLease = preparedCache.lease;
        }
      } catch {
        console.error(
          "Ask Bucky shared answer cache is unavailable; continuing without cache.",
        );
      }
    }

    reservation = await reserveAiQuestion(request);

    if (!reservation.allowed) {
      await safelyReleaseCacheLease(cacheLease);
      cacheLease = undefined;

      if (!temporaryDocument) {
        const offlineResponse = offlineAnswerResponse(normalizedQuestion);
        if (offlineResponse) return offlineResponse;
      }

      return json(
        { error: DAILY_LIMIT_MESSAGE, code: "DAILY_LIMIT" },
        {
          status: 429,
          headers: { "Retry-After": String(reservation.retryAfterSeconds) },
        },
      );
    }

    const result = temporaryDocument
      ? await answerQuestion(normalizedQuestion, { temporaryDocument })
      : await answerQuestion(normalizedQuestion);

    if (result.status === "rejected") {
      await safelyReleaseRateLimit(reservation);
      reservation = undefined;
      await safelyReleaseCacheLease(cacheLease);
      cacheLease = undefined;

      if (result.feedback) {
        const feedback = result.feedback;
        after(() =>
          safelySaveUnansweredQuestion({
            question: normalizedQuestion,
            reason: feedback.reason,
            topScore: feedback.topScore,
          }),
        );
      }

      return json(
        { error: result.answer, code: result.code },
        { status: 422 },
      );
    }

    const sources = serializeSources(result.sources);

    if (cacheLease) {
      try {
        const stored = await cacheLease.store({
          answer: result.answer,
          sources: cacheableSources(sources),
        });
        if (!stored) {
          console.error("Ask Bucky answer-cache lease expired before storage.");
        }
      } catch {
        console.error("Ask Bucky answer could not be written to shared cache.");
        await safelyReleaseCacheLease(cacheLease);
      }
      cacheLease = undefined;
    }

    const remainingDaily = reservation.remaining;
    reservation = undefined;

    return json({
      answer: result.answer,
      answerMode: "generated",
      countsTowardLimit: true,
      remainingDaily,
      sources,
    });
  } catch (error) {
    await safelyReleaseRateLimit(reservation);
    await safelyReleaseCacheLease(cacheLease);

    console.error(
      "Ask Bucky request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    if (!temporaryDocument) {
      const offlineResponse = offlineAnswerResponse(normalizedQuestion);
      if (offlineResponse) return offlineResponse;
    }

    return json(
      { error: "Ask Bucky is temporarily unavailable." },
      { status: 503 },
    );
  }
}
