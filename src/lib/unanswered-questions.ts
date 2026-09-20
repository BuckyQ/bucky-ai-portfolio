import "server-only";

import { AI_CONFIG } from "@/config/ai";
import {
  getSupabaseAdmin,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

export type UnansweredReason =
  | "no_results"
  | "low_similarity"
  | "missing_profile_info";

export interface SaveUnansweredQuestionInput {
  question: string;
  reason: UnansweredReason;
  topScore?: number;
}

const unansweredReasons = new Set<UnansweredReason>([
  "no_results",
  "low_similarity",
  "missing_profile_info",
]);

let hasWarnedAboutMissingConfig = false;

export async function saveUnansweredQuestion(
  input: SaveUnansweredQuestionInput,
): Promise<void> {
  const question = input.question.trim();

  if (!question || question.length > AI_CONFIG.maxQuestionLength) {
    throw new Error("Unanswered question failed validation.");
  }

  if (!unansweredReasons.has(input.reason)) {
    throw new Error("Unanswered question has an invalid reason.");
  }

  if (
    input.topScore !== undefined &&
    (!Number.isFinite(input.topScore) ||
      input.topScore < -1 ||
      input.topScore > 1)
  ) {
    throw new Error("Unanswered question has an invalid similarity score.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("unanswered_questions").insert({
    question,
    reason: input.reason,
    top_score: input.topScore ?? null,
  });

  if (error) {
    throw new Error(`Supabase insert failed with code ${error.code}.`);
  }
}

export async function safelySaveUnansweredQuestion(
  input: SaveUnansweredQuestionInput,
): Promise<void> {
  if (!isSupabaseServerConfigured()) {
    if (!hasWarnedAboutMissingConfig) {
      console.warn(
        "Supabase unanswered-question logging is disabled because its server environment variables are missing.",
      );
      hasWarnedAboutMissingConfig = true;
    }
    return;
  }

  try {
    await saveUnansweredQuestion(input);
  } catch (error) {
    console.error(
      "Unable to save an unanswered Ask Bucky question:",
      error instanceof Error ? error.message : "Unknown Supabase error.",
    );
  }
}
