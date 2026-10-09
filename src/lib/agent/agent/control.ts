import { type Decision, type NextAction } from "../types/agent";

export function resolveDecision(
  decision: Decision
): NextAction {
  if (decision.confidence >=  0.6) {
    return decision.action;
  }

  return "REPLAN";
}
