import { beforeEach, expect, it, vi } from "vitest";

import profileIndexData from "@/data/profile/bucky-profile-index.json";

const openAiMocks = vi.hoisted(() => ({
  chatCreate: vi.fn(),
  createEmbeddings: vi.fn(),
  getOpenAIClient: vi.fn(),
}));

vi.mock("./embedding", () => ({
  createEmbeddings: openAiMocks.createEmbeddings,
  getOpenAIClient: openAiMocks.getOpenAIClient,
}));

import { answerQuestion } from "./generate";

beforeEach(() => {
  openAiMocks.createEmbeddings.mockResolvedValue([
    profileIndexData.chunks[0]!.embedding,
  ]);
  openAiMocks.chatCreate.mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "Bucky worked on production frontend experiences at Apple.",
        },
      },
    ],
  });
  openAiMocks.getOpenAIClient.mockReturnValue({
    chat: { completions: { create: openAiMocks.chatCreate } },
  });
});

it("uses one query embedding and one generation call for a successful RAG answer", async () => {
  const question = "What did Bucky work on at Apple?";

  const result = await answerQuestion(question);

  expect(result.status).toBe("answered");
  expect(openAiMocks.createEmbeddings).toHaveBeenCalledOnce();
  expect(openAiMocks.createEmbeddings).toHaveBeenCalledWith(
    [question],
    profileIndexData.embeddingModel,
  );
  expect(openAiMocks.chatCreate).toHaveBeenCalledOnce();
});
