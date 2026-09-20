// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AskBucky from "./AskBucky";

const fetchMock = vi.fn();

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

async function renderReady() {
  const user = userEvent.setup();
  render(<AskBucky />);
  const input = screen.getByLabelText("Question") as HTMLInputElement;

  await waitFor(() => expect(input.disabled).toBe(false));

  return {
    askButton: screen.getByRole("button", { name: "Ask Bucky" }) as HTMLButtonElement,
    input,
    user,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AskBucky session usage", () => {
  it("counts only three successful answers and then disables the form", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { answer: "Grounded answer 1" }))
      .mockResolvedValueOnce(jsonResponse(200, { answer: "Grounded answer 2" }))
      .mockResolvedValueOnce(jsonResponse(200, { answer: "Grounded answer 3" }));
    const { askButton, input, user } = await renderReady();

    for (let index = 1; index <= 3; index += 1) {
      await user.type(input, `Question ${index} about Bucky`);
      await user.click(askButton);
      await screen.findByText(`Grounded answer ${index}`);

      if (index < 3) {
        const remaining = 3 - index;
        expect(
          screen.getByText(
            `${remaining} ${remaining === 1 ? "question" : "questions"} remaining`,
          ),
        ).toBeTruthy();
      }
    }

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(input.disabled).toBe(true);
    expect(askButton.disabled).toBe(true);
    expect(screen.getByText("You've reached the demo limit.")).toBeTruthy();
    expect(window.sessionStorage.getItem("ask-bucky-successful-questions")).toBe(
      "3",
    );
  });

  it.each([
    ["invalid request", 400, "Please provide a question."],
    ["unrelated question", 422, "I can only answer questions about Bucky."],
    ["no retrieval results", 422, "No matching profile information."],
    ["low similarity", 422, "The profile does not contain that detail."],
    ["embedding failure", 503, "Ask Bucky is temporarily unavailable."],
    ["generation failure", 503, "Ask Bucky is temporarily unavailable."],
    ["server failure", 500, "Ask Bucky is temporarily unavailable."],
  ])("does not count a %s", async (_, status, error) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(status, { error }));
    const { askButton, input, user } = await renderReady();

    await user.type(input, "A professional question about Bucky");
    await user.click(askButton);
    await screen.findByText(error);

    expect(screen.getByText("3 questions remaining")).toBeTruthy();
    expect(window.sessionStorage.getItem("ask-bucky-successful-questions")).toBeNull();
  });

  it("does not send a blank client-side question", async () => {
    const { askButton, input, user } = await renderReady();

    await user.type(input, "   ");

    expect(askButton.disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
  });
});

describe("AskBucky request locking", () => {
  it("sends only one request when Ask is clicked twice quickly", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { askButton, input } = await renderReady();
    fireEvent.change(input, {
      target: { value: "What did Bucky work on at Apple?" },
    });

    fireEvent.click(askButton);
    fireEvent.click(askButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(askButton.disabled).toBe(true);
    for (const suggestion of [
      "What AI projects has Bucky built?",
      "What did Bucky work on at Apple?",
      "What experience does Bucky have with RAG?",
    ]) {
      expect(
        (screen.getByRole("button", { name: suggestion }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    }

    await act(async () => {
      resolveRequest?.(jsonResponse(200, { answer: "One grounded answer" }));
    });
    await screen.findByText("One grounded answer");
  });

  it("routes suggested questions through the same API and success counter", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { answer: "Bucky has built several AI systems." }),
    );
    const { user } = await renderReady();

    await user.click(
      screen.getByRole("button", {
        name: "What AI projects has Bucky built?",
      }),
    );
    await screen.findByText("Bucky has built several AI systems.");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      question: "What AI projects has Bucky built?",
    });
    expect(screen.getByText("2 questions remaining")).toBeTruthy();
  });
});
