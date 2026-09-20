import { beforeEach, describe, expect, it, vi } from "vitest";

import { AudioInputError } from "@/lib/audio/validate-audio";

const mocks = vi.hoisted(() => ({
  createTranscription: vi.fn(),
  release: vi.fn(),
  reserveAiOperation: vi.fn(),
  toFile: vi.fn(),
  validateAudioFile: vi.fn(),
}));

vi.mock("openai", () => ({ toFile: mocks.toFile }));

vi.mock("@/lib/audio/validate-audio", async () => {
  const actual = await vi.importActual<typeof import("@/lib/audio/validate-audio")>(
    "@/lib/audio/validate-audio",
  );
  return { ...actual, validateAudioFile: mocks.validateAudioFile };
});

vi.mock("@/lib/rate-limit", () => ({
  reserveAiOperation: mocks.reserveAiOperation,
}));

vi.mock("@/lib/rag/embedding", () => ({
  getOpenAIClient: () => ({
    audio: { transcriptions: { create: mocks.createTranscription } },
  }),
}));

import { POST } from "./route";

function makeRequest(file?: File): Request {
  const formData = new FormData();
  if (file) formData.append("audio", file);
  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });
}

function reservation(allowed = true) {
  return {
    allowed,
    remaining: allowed ? 9 : 0,
    retryAfterSeconds: 300,
    release: mocks.release,
  };
}

beforeEach(() => {
  mocks.release.mockResolvedValue(undefined);
  mocks.reserveAiOperation.mockResolvedValue(reservation());
  mocks.toFile.mockResolvedValue(new File(["audio"], "voice-question.webm"));
  mocks.validateAudioFile.mockResolvedValue({
    bytes: new Uint8Array([1, 2, 3]),
    durationSeconds: 2,
    fileName: "voice-question.webm",
    mimeType: "audio/webm",
  });
  mocks.createTranscription.mockResolvedValue({ text: "What did Bucky build?" });
});

describe("POST /api/transcribe", () => {
  it("transcribes valid audio server-side without returning audio", async () => {
    const response = await POST(
      makeRequest(new File(["audio"], "voice.webm", { type: "audio/webm" })),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ transcript: "What did Bucky build?" });
    expect(mocks.createTranscription).toHaveBeenCalledOnce();
    expect(mocks.reserveAiOperation).toHaveBeenNthCalledWith(
      1,
      expect.any(Request),
      expect.objectContaining({ namespace: "voice-active", limit: 1 }),
    );
    expect(mocks.reserveAiOperation).toHaveBeenNthCalledWith(
      2,
      expect.any(Request),
      expect.objectContaining({ namespace: "voice-daily" }),
    );
    expect(mocks.release).toHaveBeenCalledOnce();
    expect(JSON.stringify(payload)).not.toContain("audio");
  });

  it("rejects missing or invalid audio before calling OpenAI", async () => {
    expect((await POST(makeRequest())).status).toBe(400);

    mocks.validateAudioFile.mockRejectedValueOnce(
      new AudioInputError("No audio was captured.", "EMPTY_AUDIO"),
    );
    const response = await POST(
      makeRequest(new File(["x"], "voice.webm", { type: "audio/webm" })),
    );

    expect(response.status).toBe(400);
    expect(mocks.createTranscription).not.toHaveBeenCalled();
    expect(mocks.reserveAiOperation).not.toHaveBeenCalled();
  });

  it("rejects a second simultaneous transcription", async () => {
    mocks.reserveAiOperation.mockResolvedValueOnce(reservation(false));

    const response = await POST(
      makeRequest(new File(["audio"], "voice.webm", { type: "audio/webm" })),
    );

    expect(response.status).toBe(429);
    expect(mocks.createTranscription).not.toHaveBeenCalled();
  });

  it("returns a safe error when transcription fails and releases the active lock", async () => {
    mocks.createTranscription.mockRejectedValue(new Error("provider failure"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      makeRequest(new File(["audio"], "voice.webm", { type: "audio/webm" })),
    );

    expect(response.status).toBe(503);
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("rejects an empty transcript without entering the answer pipeline", async () => {
    mocks.createTranscription.mockResolvedValue({ text: "   " });

    const response = await POST(
      makeRequest(new File(["audio"], "voice.webm", { type: "audio/webm" })),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("No speech");
  });
});
