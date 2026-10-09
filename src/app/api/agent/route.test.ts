import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ run: vi.fn(), reserve: vi.fn() }));
vi.mock("@/lib/agent/run", () => ({ runAgent: mocks.run }));
vi.mock("@/lib/rate-limit", () => ({ reserveAiOperation: mocks.reserve }));
import { POST } from "./route";
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  mocks.reserve.mockReset().mockResolvedValue({ allowed: true });
  mocks.run.mockReset().mockImplementation(async (_query, progress) => { progress("Searching"); return "Research answer"; });
});
const request = (query: unknown) => new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify({ query }) });
it("invokes the existing agent and streams only public progress and its final answer", async () => {
  const response = await POST(request("Compare SDKs"));
  const body = await response.text();
  expect(mocks.run).toHaveBeenCalledWith("Compare SDKs", expect.any(Function), expect.any(AbortSignal));
  expect(body).toContain('"status":"Searching"');
  expect(body).toContain('"answer":"Research answer"');
  expect(body).not.toContain("analyses");
});
it("rejects invalid input before spending quota", async () => {
  expect((await POST(request(" "))).status).toBe(400);
  expect(mocks.reserve).not.toHaveBeenCalled();
});
it("enforces shared research quota", async () => {
  mocks.reserve.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 });
  expect((await POST(request("Research"))).status).toBe(429);
  expect(mocks.run).not.toHaveBeenCalled();
});
it("fails closed when the shared backend is unavailable", async () => {
  mocks.reserve.mockRejectedValue(new Error("private service error"));
  expect((await POST(request("Research"))).status).toBe(503);
  expect(mocks.run).not.toHaveBeenCalled();
});
it("does not expose provider errors", async () => {
  mocks.run.mockRejectedValue(new Error("secret provider details"));
  const body = await (await POST(request("Research"))).text();
  expect(body).toContain('"status":"Error"');
  expect(body).not.toContain("secret provider details");
});
