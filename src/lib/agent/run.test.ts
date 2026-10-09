import { expect, it, vi, beforeEach } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ decision: vi.fn(), execute: vi.fn(), generate: vi.fn() }));
vi.mock("./agent/decision", () => ({ getDecision: mocks.decision }));
vi.mock("./agent/executor", () => ({ executeAction: mocks.execute }));
vi.mock("./actions/generate", () => ({ generateAnswer: mocks.generate }));
import { runAgent } from "./run";
beforeEach(() => {
  mocks.decision.mockReset().mockResolvedValue({ action: "CONTINUE", confidence: 1 });
  mocks.execute.mockReset().mockImplementation(async (_action, state) => { state.evidence.push({ source: "web-search", content: "Evidence" }); state.currentStep++; });
  mocks.generate.mockReset().mockResolvedValue("Fallback answer");
});
it("caps the existing loop at five attempts and uses fallback generation", async () => {
  const progress = vi.fn();
  expect(await runAgent("Query", progress, new AbortController().signal)).toBe("Fallback answer");
  expect(mocks.execute).toHaveBeenCalledTimes(5);
  expect(progress).toHaveBeenLastCalledWith("Complete");
});
it("does not generate a purported researched answer without successful evidence", async () => {
  mocks.execute.mockImplementation(async () => {});
  await expect(runAgent("Query", vi.fn(), new AbortController().signal)).rejects.toThrow("No research evidence");
  expect(mocks.generate).not.toHaveBeenCalled();
});
it("honors cancellation before provider work", async () => {
  const controller = new AbortController(); controller.abort();
  await expect(runAgent("Query", vi.fn(), controller.signal)).rejects.toThrow();
  expect(mocks.decision).not.toHaveBeenCalled();
});
