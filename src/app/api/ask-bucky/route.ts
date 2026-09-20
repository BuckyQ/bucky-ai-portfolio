import { after } from "next/server";

import { AI_CONFIG, DAILY_LIMIT_MESSAGE } from "@/config/ai";
import {
  reserveAiQuestion,
  type RateLimitReservation,
} from "@/lib/rate-limit";
import { answerQuestion } from "@/lib/rag/generate";
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

  let reservation: RateLimitReservation | undefined;

  try {
    reservation = await reserveAiQuestion(request);

    if (!reservation.allowed) {
      return json(
        { error: DAILY_LIMIT_MESSAGE, code: "DAILY_LIMIT" },
        {
          status: 429,
          headers: { "Retry-After": String(reservation.retryAfterSeconds) },
        },
      );
    }

    const result = await answerQuestion(normalizedQuestion);

    if (result.status === "rejected") {
      await reservation.release();
      reservation = undefined;

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

    const remainingDaily = reservation.remaining;
    reservation = undefined;

    return json({
      answer: result.answer,
      remainingDaily,
      sources: result.sources.map((source) => ({
        id: source.id,
        title: source.metadata.title,
        score: Number(source.score.toFixed(4)),
      })),
    });
  } catch (error) {
    if (reservation?.allowed) {
      try {
        await reservation.release();
      } catch {
        console.error("Ask Bucky rate-limit reservation could not be released.");
      }
    }

    console.error(
      "Ask Bucky request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return json(
      { error: "Ask Bucky is temporarily unavailable." },
      { status: 503 },
    );
  }
}
