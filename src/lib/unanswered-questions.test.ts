import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  insert: vi.fn(),
  isSupabaseServerConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
  isSupabaseServerConfigured: mocks.isSupabaseServerConfigured,
}));

import {
  safelySaveUnansweredQuestion,
  saveUnansweredQuestion,
} from "./unanswered-questions";

beforeEach(() => {
  mocks.isSupabaseServerConfigured.mockReturnValue(true);
  mocks.insert.mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.getSupabaseAdmin.mockReturnValue({ from: mocks.from });
});

describe("unanswered-question feedback", () => {
  it("stores a trimmed question, reason, and top score", async () => {
    await saveUnansweredQuestion({
      question: "  What certifications does Bucky have?  ",
      reason: "low_similarity",
      topScore: 0.17,
    });

    expect(mocks.from).toHaveBeenCalledWith("unanswered_questions");
    expect(mocks.insert).toHaveBeenCalledWith({
      question: "What certifications does Bucky have?",
      reason: "low_similarity",
      top_score: 0.17,
    });
  });

  it("absorbs Supabase failures and logs only a safe server-side message", async () => {
    mocks.insert.mockRejectedValue(new Error("connection unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safelySaveUnansweredQuestion({
        question: "What awards has Bucky received?",
        reason: "no_results",
      }),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Unable to save an unanswered Ask Bucky question:",
      "connection unavailable",
    );
  });

  it("is a no-op when server-side Supabase configuration is absent", async () => {
    mocks.isSupabaseServerConfigured.mockReturnValue(false);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await safelySaveUnansweredQuestion({
      question: "What certifications does Bucky have?",
      reason: "missing_profile_info",
    });

    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
