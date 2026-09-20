import { beforeEach, describe, expect, it, vi } from "vitest";

import profileIndexData from "@/data/profile/bucky-profile-index.json";

const mocks = vi.hoisted(() => ({
  cosineSimilarity: vi.fn(),
  createEmbeddings: vi.fn(),
}));

vi.mock("./embedding", () => ({
  createEmbeddings: mocks.createEmbeddings,
}));

vi.mock("./similarity", () => ({
  cosineSimilarity: mocks.cosineSimilarity,
}));

import { retrieveChunks } from "./retrieve";

beforeEach(() => {
  mocks.createEmbeddings.mockResolvedValue([[1, 0, 0]]);
  mocks.cosineSimilarity.mockReturnValue(0.75);
});

describe("retrieveChunks", () => {
  it("loads precomputed chunk embeddings and embeds only the query once", async () => {
    const question = "What did Bucky work on at Apple?";

    const results = await retrieveChunks(question, { topK: 3 });

    expect(results).toHaveLength(3);
    expect(mocks.createEmbeddings).toHaveBeenCalledOnce();
    expect(mocks.createEmbeddings).toHaveBeenCalledWith(
      [question],
      profileIndexData.embeddingModel,
    );
    expect(mocks.cosineSimilarity).toHaveBeenCalledTimes(
      profileIndexData.chunks.length,
    );
    expect(mocks.cosineSimilarity.mock.calls[0]?.[0]).toEqual([1, 0, 0]);
    expect(mocks.cosineSimilarity.mock.calls[0]?.[1]).toEqual(
      profileIndexData.chunks[0]?.embedding,
    );
  });

  it("stops before similarity scoring when query embedding fails", async () => {
    mocks.createEmbeddings.mockRejectedValue(new Error("embedding unavailable"));

    await expect(
      retrieveChunks("What experience does Bucky have with RAG?"),
    ).rejects.toThrow("embedding unavailable");
    expect(mocks.createEmbeddings).toHaveBeenCalledOnce();
    expect(mocks.cosineSimilarity).not.toHaveBeenCalled();
  });

  it("does not call OpenAI for a blank query", async () => {
    await expect(retrieveChunks("   ")).resolves.toEqual([]);
    expect(mocks.createEmbeddings).not.toHaveBeenCalled();
  });
});
