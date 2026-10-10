// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@/lib/job-agent", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/job-agent")>(), runJobAgent: mocks.run }));
import JobAgentDemo from "./JobAgentDemo";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function fill() {
  fireEvent.change(screen.getByLabelText("OpenAI API key"), { target: { value: "test-key" } });
  fireEvent.change(screen.getByLabelText("Company name or official URL"), { target: { value: "Example" } });
  fireEvent.change(screen.getByLabelText("Job description"), { target: { value: "React role" } });
  fireEvent.change(screen.getByLabelText("Resume evidence"), { target: { value: "React experience" } });
}
it("clears the key on submit and presents the final result without storing credentials", async () => {
  const localStore = vi.spyOn(Storage.prototype, "setItem");
  mocks.run.mockResolvedValue({ answer: "Interview plan result" });
  render(<JobAgentDemo />); fill();
  fireEvent.click(screen.getByRole("button", { name: "Run with my key" }));
  expect((screen.getByLabelText("OpenAI API key") as HTMLInputElement).value).toBe("");
  await waitFor(() => expect(screen.getByText("Interview plan result")).toBeTruthy());
  expect(localStore).not.toHaveBeenCalled(); localStore.mockRestore();
});
it("aborts work when the visitor leaves", () => {
  mocks.run.mockImplementation(() => new Promise(() => {}));
  const view = render(<JobAgentDemo />); fill();
  fireEvent.click(screen.getByRole("button", { name: "Run with my key" }));
  const signal = mocks.run.mock.calls[0][3] as AbortSignal;
  view.unmount(); expect(signal.aborted).toBe(true);
});
