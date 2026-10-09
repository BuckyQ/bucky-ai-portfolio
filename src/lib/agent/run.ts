import "server-only";
import { getDecision } from "./agent/decision";
import { resolveDecision } from "./agent/control";
import { executeAction } from "./agent/executor";
import { generateAnswer } from "./actions/generate";
import type { AgentState } from "./types/agent";
import { researchContext } from "./runtime";

export const MAX_ATTEMPTS = 5;
export async function runAgent(query: string, onProgress: (status: string) => void, signal: AbortSignal): Promise<string> {
  return researchContext.run(signal, async () => {
    onProgress("Planning");
    const state: AgentState = {
      query, plan: [
        { type: "WEB_SEARCH", description: `Research the full query using primary sources: ${query}` },
        { type: "ANALYZE", description: "Analyze the evidence against every part of the research query." },
      ], evidence: [], analyses: [], attempts: 0, currentStep: 0,
    };
    const deadline = Date.now() + 85_000;
    while (state.attempts < MAX_ATTEMPTS && !state.answer && Date.now() < deadline) {
      signal.throwIfAborted();
      const decision = await getDecision(state);
      if (!decision) break;
      const action = resolveDecision(decision);
      const step = state.plan[state.currentStep];
      onProgress(action === "CONTINUE" ? (step?.type === "ANALYZE" ? "Analyzing" : "Searching") :
        action === "SEARCH_MORE" ? "Searching for more evidence" : action === "REPLAN" ? "Replanning" : "Generating");
      await executeAction(action, state);
      state.attempts += 1;
    }
    signal.throwIfAborted();
    if (!state.evidence.some(e => e.source === "web-search")) throw new Error("No research evidence available");
    if (!state.answer) { onProgress("Generating"); state.answer = await generateAnswer(state); }
    if (!state.answer?.trim()) throw new Error("Empty research answer");
    onProgress("Complete");
    return state.answer;
  });
}
