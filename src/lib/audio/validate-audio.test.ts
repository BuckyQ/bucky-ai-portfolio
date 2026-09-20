import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_CONFIG } from "@/config/ai";

const mocks = vi.hoisted(() => ({ parseBuffer: vi.fn() }));

vi.mock("music-metadata", () => ({ parseBuffer: mocks.parseBuffer }));

import { validateAudioFile } from "./validate-audio";

beforeEach(() => {
  mocks.parseBuffer.mockResolvedValue({ format: { duration: 12 } });
});

describe("voice recording validation", () => {
  it("accepts a supported recording with a verified duration", async () => {
    const result = await validateAudioFile(
      new File(["audio data"], "voice.webm", { type: "audio/webm" }),
    );

    expect(result).toMatchObject({
      durationSeconds: 12,
      fileName: "voice-question.webm",
      mimeType: "audio/webm",
    });
  });

  it("rejects recordings longer than thirty seconds before transcription", async () => {
    mocks.parseBuffer.mockResolvedValue({
      format: { duration: AI_CONFIG.maxRecordingSeconds + 1 },
    });

    await expect(
      validateAudioFile(
        new File(["audio data"], "voice.webm", { type: "audio/webm" }),
      ),
    ).rejects.toThrow("30 seconds or shorter");
  });

  it("rejects empty, oversized, unsupported, and unparseable audio", async () => {
    await expect(
      validateAudioFile(new File([], "voice.webm", { type: "audio/webm" })),
    ).rejects.toThrow("No audio was captured");

    await expect(
      validateAudioFile(
        new File(
          [new Uint8Array(AI_CONFIG.maxAudioBytes + 1)],
          "voice.webm",
          { type: "audio/webm" },
        ),
      ),
    ).rejects.toThrow("5 MB or smaller");

    await expect(
      validateAudioFile(
        new File(["audio"], "voice.aac", { type: "audio/aac" }),
      ),
    ).rejects.toThrow("not supported");

    mocks.parseBuffer.mockRejectedValue(new Error("bad container"));
    await expect(
      validateAudioFile(
        new File(["audio"], "voice.webm", { type: "audio/webm" }),
      ),
    ).rejects.toThrow("could not be read");
  });
});
