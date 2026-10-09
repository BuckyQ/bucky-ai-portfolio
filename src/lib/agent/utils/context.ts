import type { Analysis, Evidence } from "../types/agent";

export function formatEvidence(evidence: Evidence[], startIndex = 0): string {
  return evidence
    .map((item, index) => `Evidence ${index + startIndex}: ${item.content}`)
    .join("\n\n");
}

export function formatAnalyses(analyses: Analysis[]): string {
  return analyses
    .map((item, index) => `Analysis ${index}: ${item.content}`)
    .join("\n\n");
}
