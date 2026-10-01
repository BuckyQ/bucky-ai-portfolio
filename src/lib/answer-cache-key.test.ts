import { describe, expect, it } from "vitest";

import {
  createAnswerCacheKey,
  normalizeAnswerCacheQuestion,
} from "./answer-cache-key";

const context = {
  answerModel: "gpt-test",
  profileSourceHash: "profile-v1",
  promptVersion: "prompt-v1",
  retrievalVersion: "retrieval-v1",
  secret: "test-secret",
};

describe("answer-cache keys", () => {
  it("normalizes harmless casing, spacing, and terminal punctuation", () => {
    expect(normalizeAnswerCacheQuestion("  Who   is BUCKY???  ")).toBe(
      "who is bucky",
    );
    expect(createAnswerCacheKey("Who is Bucky?", context)).toBe(
      createAnswerCacheKey(" who is BUCKY ", context),
    );
  });

  it("does not place the raw question in the persisted key", () => {
    const key = createAnswerCacheKey("What did Bucky build at Apple?", context);

    expect(key).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(key).not.toContain("bucky");
    expect(key).not.toContain("apple");
  });

  it("invalidates keys when profile, prompt, retrieval, or model changes", () => {
    const question = "Who is Bucky?";
    const baseline = createAnswerCacheKey(question, context);

    for (const override of [
      { profileSourceHash: "profile-v2" },
      { promptVersion: "prompt-v2" },
      { retrievalVersion: "retrieval-v2" },
      { answerModel: "gpt-next" },
    ]) {
      expect(
        createAnswerCacheKey(question, { ...context, ...override }),
      ).not.toBe(baseline);
    }
  });
});
