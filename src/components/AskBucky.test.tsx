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
const originalMediaDevices = Object.getOwnPropertyDescriptor(
  window.navigator,
  "mediaDevices",
);
let recordedBlob = new Blob(["recorded audio"], { type: "audio/webm" });

class MockMediaRecorder {
  static isTypeSupported(type: string) {
    return type.startsWith("audio/webm");
  }

  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  state: RecordingState = "inactive";
  stream: MediaStream;

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream;
    this.mimeType = options?.mimeType ?? "audio/webm";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    this.ondataavailable?.({ data: recordedBlob } as BlobEvent);
    this.onstop?.(new Event("stop"));
  }
}

function enableMicrophone(
  getUserMedia: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  }),
) {
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  return getUserMedia;
}

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
  const input = screen.getByLabelText("Question about Bucky") as HTMLInputElement;

  await waitFor(() => expect(input.disabled).toBe(false));

  return {
    askButton: screen.getByRole("button", {
      name: "Send question to Ask Bucky AI",
    }) as HTMLButtonElement,
    input,
    user,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  recordedBlob = new Blob(["recorded audio"], { type: "audio/webm" });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (originalMediaDevices) {
    Object.defineProperty(window.navigator, "mediaDevices", originalMediaDevices);
  } else {
    Reflect.deleteProperty(window.navigator, "mediaDevices");
  }
});

describe("AskBucky session usage", () => {
  it("shows a direct assistant introduction without consuming a question", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        answer:
          "I'm Ask Bucky AI, Bucky Qian's portfolio assistant.",
        countsTowardLimit: false,
        sources: [],
      }),
    );
    const { askButton, input, user } = await renderReady();

    await user.type(input, "who r u");
    await user.click(askButton);
    await screen.findByText(
      "I'm Ask Bucky AI, Bucky Qian's portfolio assistant.",
    );

    expect(screen.getByText("3 questions remaining")).toBeTruthy();
    expect(window.sessionStorage.getItem("ask-bucky-successful-questions")).toBeNull();
  });

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
    expect(
      screen.getByRole("button", { name: "Show suggested questions" }),
    ).toBeTruthy();
    for (const suggestion of [
      "What AI projects has Bucky built?",
      "What did Bucky work on at Apple?",
      "What experience does Bucky have with RAG?",
    ]) {
      expect(screen.queryByRole("button", { name: suggestion })).toBeNull();
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

describe("AskBucky conversation flow", () => {
  it("collapses suggested questions after submission and lets the user reopen them", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { answer: "Bucky has built several AI systems." }),
    );
    const { askButton, input, user } = await renderReady();

    await user.type(input, "What AI projects has Bucky built?");
    await user.click(askButton);
    await screen.findByText("Bucky has built several AI systems.");

    expect(
      screen.queryByRole("button", {
        name: "What AI projects has Bucky built?",
      }),
    ).toBeNull();
    const showSuggestions = screen.getByRole("button", {
      name: "Show suggested questions",
    });
    expect(showSuggestions.getAttribute("aria-expanded")).toBe("false");

    await user.click(showSuggestions);

    expect(
      screen.getByRole("button", {
        name: "What AI projects has Bucky built?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hide suggested questions" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("automatically follows the latest conversation state", async () => {
    const originalScrollTo = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollTo",
    );
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    try {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { answer: "A grounded answer about Bucky." }),
      );
      const { askButton, input, user } = await renderReady();
      const messageViewport = screen
        .getByText(
          "Ask me about Bucky's professional background, projects, skills, or education.",
        )
        .closest(".ask-bucky-messages");
      expect(messageViewport).toBeTruthy();
      Object.defineProperty(messageViewport, "scrollHeight", {
        configurable: true,
        value: 720,
      });
      scrollToMock.mockClear();

      await user.type(input, "What is Bucky's RAG experience?");
      await user.click(askButton);
      await screen.findByText("A grounded answer about Bucky.");

      await waitFor(() =>
        expect(scrollToMock).toHaveBeenCalledWith({
          top: 720,
          behavior: "smooth",
        }),
      );
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollTo",
          originalScrollTo,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
      }
    }
  });
});

describe("AskBucky voice input", () => {
  it("shows a disabled voice control when recording is unsupported", async () => {
    const { input } = await renderReady();
    const voiceButton = screen.getByRole("button", {
      name: "Start voice question",
    }) as HTMLButtonElement;

    expect(input.disabled).toBe(false);
    expect(voiceButton.disabled).toBe(true);
    expect(screen.getByText("Voice / Unavailable")).toBeTruthy();
  });

  it("handles microphone permission denial without consuming quota", async () => {
    enableMicrophone(
      vi
        .fn()
        .mockRejectedValue(new DOMException("denied", "NotAllowedError")),
    );
    const { user } = await renderReady();

    await user.click(
      screen.getByRole("button", { name: "Start voice question" }),
    );

    await screen.findByText(/Microphone permission was denied/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
  });

  it("does not start multiple recordings while permission is pending", async () => {
    let resolvePermission: ((stream: MediaStream) => void) | undefined;
    const getUserMedia = enableMicrophone(
      vi.fn().mockReturnValue(
        new Promise<MediaStream>((resolve) => {
          resolvePermission = resolve;
        }),
      ),
    );
    const { askButton } = await renderReady();
    const voiceButton = screen.getByRole("button", {
      name: "Start voice question",
    });

    fireEvent.click(voiceButton);
    fireEvent.click(voiceButton);

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(askButton.disabled).toBe(true);
    expect(screen.getByText("Voice / Starting...")).toBeTruthy();

    await act(async () => {
      resolvePermission?.({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream);
    });
    await screen.findByRole("button", { name: "Stop recording" });
  });

  it("does not transcribe an empty recording", async () => {
    recordedBlob = new Blob([], { type: "audio/webm" });
    enableMicrophone();
    const { user } = await renderReady();

    await user.click(
      screen.getByRole("button", { name: "Start voice question" }),
    );
    await user.click(screen.getByRole("button", { name: "Stop recording" }));

    await screen.findByText("No audio was captured.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
  });

  it("handles transcription failure without consuming quota", async () => {
    enableMicrophone();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(503, { error: "Voice transcription is temporarily unavailable." }),
    );
    const { user } = await renderReady();

    await user.click(
      screen.getByRole("button", { name: "Start voice question" }),
    );
    await user.click(screen.getByRole("button", { name: "Stop recording" }));

    await screen.findByText("Voice transcription is temporarily unavailable.");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/transcribe");
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
  });

  it("puts a transcript through the existing RAG flow and counts only the final answer", async () => {
    enableMicrophone();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { transcript: "What AI projects has Bucky built?" }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { answer: "Bucky built grounded AI projects." }),
      );
    const { askButton, input, user } = await renderReady();

    await user.click(
      screen.getByRole("button", { name: "Start voice question" }),
    );
    expect(screen.getByText(/Voice \/ Recording/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Stop recording" }));

    await waitFor(() =>
      expect(input.value).toBe("What AI projects has Bucky built?"),
    );
    expect(screen.getByText("Voice / Ready")).toBeTruthy();
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
    expect(window.sessionStorage.getItem("ask-bucky-successful-questions")).toBeNull();

    await user.click(askButton);
    await screen.findByText("Bucky built grounded AI projects.");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/ask-bucky");
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toEqual({
      question: "What AI projects has Bucky built?",
    });
    expect(screen.getByText("2 questions remaining")).toBeTruthy();
  });
});

describe("AskBucky temporary document input", () => {
  it("uploads a TXT file and sends its temporary context through the normal API", async () => {
    const file = new File(["RAG and Kubernetes requirements"], "role.txt", {
      type: "text/plain",
    });
    const document = {
      fileName: file.name,
      mimeType: "text/plain",
      size: file.size,
      text: "RAG and Kubernetes requirements",
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { document }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          answer: "Bucky's RAG experience overlaps with the role.",
          sources: [
            {
              id: "temporary-document-chunk-0",
              title: "Uploaded Document: role.txt",
              score: 0.8,
              type: "uploaded-document",
            },
          ],
        }),
      );
    const { askButton, input, user } = await renderReady();

    await user.click(
      screen.getByRole("button", { name: "Compare a Job / Document" }),
    );
    await user.upload(
      screen.getByLabelText("Upload a PDF or TXT document"),
      file,
    );

    await screen.findByText("role.txt");
    expect(
      screen.getByText("Ask how Bucky's experience relates to this document."),
    ).toBeTruthy();
    await user.type(input, "How does Bucky match this role?");
    await user.click(askButton);
    await screen.findByText("Bucky's RAG experience overlaps with the role.");

    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toEqual({
      question: "How does Bucky match this role?",
      temporaryDocument: document,
    });
    expect(
      screen.getByText("Sources / Uploaded Document: role.txt"),
    ).toBeTruthy();
  });

  it("rejects an unsupported file client-side without consuming quota", async () => {
    const { user } = await renderReady();
    await user.click(
      screen.getByRole("button", { name: "Compare a Job / Document" }),
    );
    const input = screen.getByLabelText("Upload a PDF or TXT document");

    fireEvent.change(input, {
      target: {
        files: [
          new File(["doc"], "role.docx", { type: "application/zip" }),
        ],
      },
    });

    await screen.findByText("Please upload a PDF or TXT file.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
  });

  it("shows extraction failure without consuming quota", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, { error: "This document could not be read." }),
    );
    const { user } = await renderReady();
    await user.click(
      screen.getByRole("button", { name: "Compare a Job / Document" }),
    );
    await user.upload(
      screen.getByLabelText("Upload a PDF or TXT document"),
      new File(["role"], "role.txt", { type: "text/plain" }),
    );

    await screen.findByText("This document could not be read.");
    expect(screen.getByText("3 questions remaining")).toBeTruthy();
    expect(window.sessionStorage.getItem("ask-bucky-successful-questions")).toBeNull();
  });
});
