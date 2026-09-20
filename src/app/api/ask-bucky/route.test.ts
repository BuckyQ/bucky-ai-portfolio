import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_CONFIG, DAILY_LIMIT_MESSAGE } from "@/config/ai";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  answerQuestion: vi.fn(),
  reserveAiQuestion: vi.fn(),
  safelySaveUnansweredQuestion: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: mocks.after,
}));

vi.mock("@/lib/rate-limit", () => ({
  reserveAiQuestion: mocks.reserveAiQuestion,
}));

vi.mock("@/lib/rag/generate", () => ({
  answerQuestion: mocks.answerQuestion,
}));

vi.mock("@/lib/unanswered-questions", () => ({
  safelySaveUnansweredQuestion: mocks.safelySaveUnansweredQuestion,
}));

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ask-bucky", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

function makeReservation(
  overrides: Partial<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  }> = {},
) {
  return {
    allowed: true,
    remaining: 9,
    retryAfterSeconds: 86_400,
    release: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  mocks.after.mockImplementation((callback: () => unknown) => {
    void Promise.resolve().then(callback).catch(() => undefined);
  });
  mocks.safelySaveUnansweredQuestion.mockResolvedValue(undefined);
});

describe("POST /api/ask-bucky input validation", () => {
  const invalidBodies = [
    ["missing question", {}],
    ["empty question", { question: "" }],
    ["whitespace-only question", { question: "     " }],
    ["non-string question", { question: 42 }],
    [
      "question over the configured maximum",
      { question: "x".repeat(AI_CONFIG.maxQuestionLength + 1) },
    ],
  ] as const;

  it.each(invalidBodies)("rejects a %s without side effects", async (_, body) => {
    const response = await POST(makeRequest(body));

    expect(response.status).toBe(400);
    expect(mocks.reserveAiQuestion).not.toHaveBeenCalled();
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
    expect(mocks.safelySaveUnansweredQuestion).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before reserving quota", async () => {
    const request = new Request("http://localhost/api/ask-bucky", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.reserveAiQuestion).not.toHaveBeenCalled();
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });
});

describe("POST /api/ask-bucky request flow", () => {
  it("returns a grounded answer and keeps the successful reservation", async () => {
    const reservation = makeReservation({ remaining: 8 });
    mocks.reserveAiQuestion.mockResolvedValue(reservation);
    mocks.answerQuestion.mockResolvedValue({
      status: "answered",
      answer: "Bucky built frontend product experiences at Apple.",
      sources: [
        {
          id: "experience-chunk-0",
          text: "Bucky worked at Apple.",
          score: 0.91,
          metadata: {
            documentId: "experience",
            chunkIndex: "0",
            title: "Experience",
          },
        },
      ],
    });

    const response = await POST(
      makeRequest({ question: "  What did Bucky work on at Apple?  " }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      answer: "Bucky built frontend product experiences at Apple.",
      remainingDaily: 8,
    });
    expect(mocks.reserveAiQuestion).toHaveBeenCalledOnce();
    expect(mocks.answerQuestion).toHaveBeenCalledOnce();
    expect(mocks.answerQuestion).toHaveBeenCalledWith(
      "What did Bucky work on at Apple?",
    );
    expect(reservation.release).not.toHaveBeenCalled();
    expect(mocks.safelySaveUnansweredQuestion).not.toHaveBeenCalled();
  });

  it("returns HTTP 429 before RAG work when the daily limit is full", async () => {
    mocks.reserveAiQuestion.mockResolvedValue(
      makeReservation({ allowed: false, remaining: 0, retryAfterSeconds: 120 }),
    );

    const response = await POST(
      makeRequest({ question: "What AI projects has Bucky built?" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(payload).toEqual({ error: DAILY_LIMIT_MESSAGE, code: "DAILY_LIMIT" });
    expect(mocks.answerQuestion).not.toHaveBeenCalled();
  });

  it("releases quota and logs a no-results question", async () => {
    const reservation = makeReservation();
    mocks.reserveAiQuestion.mockResolvedValue(reservation);
    mocks.answerQuestion.mockResolvedValue({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      answer: "No matching public profile information was found.",
      sources: [],
      feedback: { reason: "no_results" },
    });

    const response = await POST(
      makeRequest({ question: "What certifications does Bucky have?" }),
    );

    expect(response.status).toBe(422);
    expect(reservation.release).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(mocks.safelySaveUnansweredQuestion).toHaveBeenCalledWith({
        question: "What certifications does Bucky have?",
        reason: "no_results",
        topScore: undefined,
      });
    });
  });

  it("releases quota and records the top score for low similarity", async () => {
    const reservation = makeReservation();
    mocks.reserveAiQuestion.mockResolvedValue(reservation);
    mocks.answerQuestion.mockResolvedValue({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      answer: "The public profile does not contain enough information.",
      sources: [],
      feedback: { reason: "low_similarity", topScore: 0.12 },
    });

    const response = await POST(
      makeRequest({ question: "What database certifications does Bucky have?" }),
    );

    expect(response.status).toBe(422);
    expect(reservation.release).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(mocks.safelySaveUnansweredQuestion).toHaveBeenCalledWith({
        question: "What database certifications does Bucky have?",
        reason: "low_similarity",
        topScore: 0.12,
      });
    });
  });

  it("does not store an unrelated rejected question", async () => {
    const reservation = makeReservation();
    mocks.reserveAiQuestion.mockResolvedValue(reservation);
    mocks.answerQuestion.mockResolvedValue({
      status: "rejected",
      code: "OUT_OF_SCOPE",
      answer: "I can only answer questions about Bucky.",
      sources: [],
    });

    const response = await POST(
      makeRequest({ question: "What is today's weather?" }),
    );

    expect(response.status).toBe(422);
    expect(reservation.release).toHaveBeenCalledOnce();
    expect(mocks.safelySaveUnansweredQuestion).not.toHaveBeenCalled();
  });

  it.each(["query embedding", "answer generation"])(
    "returns a safe 503 and releases quota when %s fails",
    async (stage) => {
      const reservation = makeReservation();
      mocks.reserveAiQuestion.mockResolvedValue(reservation);
      mocks.answerQuestion.mockRejectedValue(new Error(`${stage} failed`));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await POST(
        makeRequest({ question: "What did Bucky work on at Apple?" }),
      );
      const payload = await response.json();

      expect(response.status).toBe(503);
      expect(payload).toEqual({ error: "Ask Bucky is temporarily unavailable." });
      expect(reservation.release).toHaveBeenCalledOnce();
      expect(mocks.safelySaveUnansweredQuestion).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    },
  );

  it("returns the fallback even when deferred feedback logging rejects", async () => {
    const reservation = makeReservation();
    mocks.reserveAiQuestion.mockResolvedValue(reservation);
    mocks.answerQuestion.mockResolvedValue({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      answer: "No answer is available in the public profile.",
      sources: [],
      feedback: { reason: "no_results" },
    });
    mocks.safelySaveUnansweredQuestion.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await POST(
      makeRequest({ question: "What awards has Bucky received?" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(payload.error).toBe("No answer is available in the public profile.");
  });
});
