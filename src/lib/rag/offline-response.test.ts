import { describe, expect, it } from "vitest";

import { getOfflineProfileResponse } from "./offline-response";

describe("offline profile responses", () => {
  it.each([
    ["Who is Bucky?", "overview"],
    ["What did Bucky work on at Apple?", "apple"],
    ["What did Bucky build at Topify AI?", "topify"],
    ["What AI projects has Bucky built?", "projects"],
    ["What experience does Bucky have with RAG?", "rag"],
    ["What degrees does Bucky have?", "education"],
  ])("provides a grounded built-in answer for %s", (question, kind) => {
    expect(getOfflineProfileResponse(question)).toMatchObject({ kind });
  });

  it.each([
    "What is today's weather?",
    "Does Bucky know Kubernetes?",
    "What salary did Bucky earn?",
  ])("does not guess for unsupported questions: %s", (question) => {
    expect(getOfflineProfileResponse(question)).toBeNull();
  });
});
