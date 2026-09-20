import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AI_CONFIG,
  INSUFFICIENT_PROFILE_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
} from "@/config/ai";

const mocks = vi.hoisted(() => ({
  analyzeQuestionScope: vi.fn(),
  chatCreate: vi.fn(),
  getOpenAIClient: vi.fn(),
  retrieveChunks: vi.fn(),
}));

vi.mock("./question-scope", () => ({
  analyzeQuestionScope: mocks.analyzeQuestionScope,
}));

vi.mock("./retrieve", () => ({
  retrieveChunks: mocks.retrieveChunks,
}));

vi.mock("./embedding", () => ({
  getOpenAIClient: mocks.getOpenAIClient,
}));

import { answerQuestion, generateAnswer } from "./generate";

function source(text: string, score = 0.9) {
  return {
    id: "experience-chunk-0",
    text,
    score,
    metadata: {
      documentId: "experience",
      chunkIndex: "0",
      title: "Experience",
    },
  };
}

beforeEach(() => {
  mocks.analyzeQuestionScope.mockReturnValue({
    isProfessionalQuestion: true,
    isSafeToStore: true,
  });
  mocks.getOpenAIClient.mockReturnValue({
    chat: { completions: { create: mocks.chatCreate } },
  });
});

describe("answerQuestion", () => {
  it("skips generation and reports no retrieval results", async () => {
    mocks.retrieveChunks.mockResolvedValue([]);

    const result = await answerQuestion("What certifications does Bucky have?");

    expect(result).toMatchObject({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      answer: INSUFFICIENT_PROFILE_MESSAGE,
      feedback: { reason: "no_results" },
    });
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("skips generation and records a low top similarity score", async () => {
    const topScore = AI_CONFIG.similarityThreshold - 0.01;
    mocks.retrieveChunks.mockResolvedValue([source("Weakly related context.", topScore)]);

    const result = await answerQuestion("What awards has Bucky received?");

    expect(result).toMatchObject({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      feedback: { reason: "low_similarity", topScore },
    });
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("rejects unrelated questions without generation or feedback storage", async () => {
    mocks.analyzeQuestionScope.mockReturnValue({
      isProfessionalQuestion: false,
      isSafeToStore: false,
    });
    mocks.retrieveChunks.mockResolvedValue([
      source("Bucky lives in Mountain View.", 0.95),
    ]);

    const result = await answerQuestion("What is today's weather?");

    expect(result).toEqual({
      status: "rejected",
      code: "OUT_OF_SCOPE",
      answer: OUT_OF_SCOPE_MESSAGE,
      sources: [],
    });
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("marks a grounded model fallback as missing profile information", async () => {
    mocks.retrieveChunks.mockResolvedValue([
      source("Bucky worked at Apple.", 0.91),
    ]);
    mocks.chatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "I don't have that information in Bucky's public profile.",
          },
        },
      ],
    });

    const result = await answerQuestion("What salary did Bucky earn at Apple?");

    expect(result).toMatchObject({
      status: "rejected",
      code: "INSUFFICIENT_CONTEXT",
      feedback: { reason: "missing_profile_info", topScore: 0.91 },
    });
    expect(mocks.chatCreate).toHaveBeenCalledOnce();
  });

  it("propagates generation failures for the route to handle safely", async () => {
    mocks.retrieveChunks.mockResolvedValue([
      source("Bucky worked at Apple as a Frontend Engineer."),
    ]);
    mocks.chatCreate.mockRejectedValue(new Error("OpenAI unavailable"));

    await expect(
      answerQuestion("What was Bucky's role at Apple?"),
    ).rejects.toThrow("OpenAI unavailable");
  });
});

describe("generateAnswer grounding", () => {
  it("supplies the selected context and requires a concise grounded answer", async () => {
    mocks.chatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Bucky worked at Apple as a Frontend Engineer.",
          },
        },
      ],
    });

    const answer = await generateAnswer("What was Bucky's role at Apple?", [
      source("Bucky worked at Apple as a Frontend Engineer."),
    ]);

    expect(answer).toBe("Bucky worked at Apple as a Frontend Engineer.");
    expect(mocks.chatCreate).toHaveBeenCalledOnce();
    const request = mocks.chatCreate.mock.calls[0]?.[0];
    expect(request.model).toBe(AI_CONFIG.answerModel);
    expect(request.temperature).toBe(0);
    expect(request.messages[0].content).toContain(
      "Answer only using the supplied context about Bucky.",
    );
    expect(request.messages[0].content).toContain("Do not invent information.");
    expect(request.messages[1].content).toContain(
      "Bucky worked at Apple as a Frontend Engineer.",
    );
    expect(request.messages[1].content).toContain(
      "Question:\nWhat was Bucky's role at Apple?",
    );
  });

  it("returns the exact insufficient-context fallback when no source is supplied", async () => {
    const answer = await generateAnswer(
      "What salary did Bucky earn at Apple?",
      [],
    );

    expect(answer).toBe(
      "I don't have that information in Bucky's public profile.",
    );
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });
});
