import { afterEach, expect, it, vi } from "vitest";
import { jobStages, runJobAgent } from "./job-agent";
afterEach(() => vi.unstubAllGlobals());
const input = { company: "Example", job: "React role", resume: "React experience" };
it("runs all eight stages, with two specialists and an evidence-linked plan", async () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ type: "message", content: [{ type: "output_text", text: "Useful result" }] }] }) });
  vi.stubGlobal("fetch", mockFetch);
  const result = await runJobAgent(input, "test-key", vi.fn(), new AbortController().signal);
  expect(result.events.filter(event => event.status === "complete").map(event => event.stage)).toEqual(jobStages);
  expect(mockFetch).toHaveBeenCalledTimes(6);
  for (const [url, options] of mockFetch.mock.calls) {
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(JSON.parse(options.body).store).toBe(false);
  }
  expect(JSON.stringify(result)).not.toContain("test-key");
});
it("does not leak provider response details on authentication failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
  await expect(runJobAgent(input, "test-key", vi.fn(), new AbortController().signal)).rejects.toThrow("OpenAI rejected the key");
});
it("validates before making requests and respects cancellation", async () => {
  const mockFetch = vi.fn(); vi.stubGlobal("fetch", mockFetch);
  await expect(runJobAgent(input, "", vi.fn(), new AbortController().signal)).rejects.toThrow("Provide a key");
  const controller = new AbortController(); controller.abort();
  await expect(runJobAgent(input, "test-key", vi.fn(), controller.signal)).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
});
