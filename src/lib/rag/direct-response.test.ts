import { describe, expect, it } from "vitest";

import { getDirectResponse } from "./direct-response";

describe("getDirectResponse", () => {
  it.each([
    "who r u",
    "Who are you?",
    "Are you Bucky?",
    "hello",
  ])("introduces the assistant for %s", (question) => {
    expect(getDirectResponse(question)).toMatchObject({
      kind: "assistant-introduction",
      answer: expect.stringContaining("I'm Ask Bucky AI"),
    });
  });

  it.each([
    "What can you do?",
    "How can u help me?",
    "What should I ask you?",
  ])("explains its capabilities for %s", (question) => {
    expect(getDirectResponse(question)).toMatchObject({
      kind: "capabilities",
      answer: expect.stringContaining("I can answer questions about Bucky Qian"),
    });
  });

  it.each([
    "whats the purpose of this website",
    "What's this portfolio about?",
    "What is this site for?",
    "Why was this website made?",
    "Tell me about this portfolio.",
  ])("explains the portfolio purpose for %s", (question) => {
    expect(getDirectResponse(question)).toMatchObject({
      kind: "site-purpose",
      answer: expect.stringContaining("interactive portfolio and resume"),
    });
  });

  it.each([
    "Who is Bucky?",
    "What did Bucky work on at Apple?",
    "What is today's weather?",
  ])("leaves substantive questions for the normal RAG flow: %s", (question) => {
    expect(getDirectResponse(question)).toBeNull();
  });
});
