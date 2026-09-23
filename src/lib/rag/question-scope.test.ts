import { describe, expect, it } from "vitest";

import { analyzeQuestionScope } from "./question-scope";

describe("analyzeQuestionScope", () => {
  it.each([
    "Who is Bucky?",
    "Tell me about Bucky.",
    "What does Bucky do?",
    "What did he build at Apple?",
  ])("accepts a professional question about Bucky: %s", (question) => {
    expect(analyzeQuestionScope(question)).toMatchObject({
      isProfessionalQuestion: true,
      isSafeToStore: true,
    });
  });

  it.each(["Who are you?", "What is today's weather?"])(
    "leaves a non-professional question outside the RAG scope: %s",
    (question) => {
      expect(analyzeQuestionScope(question)).toMatchObject({
        isProfessionalQuestion: false,
        isSafeToStore: false,
      });
    },
  );
});
