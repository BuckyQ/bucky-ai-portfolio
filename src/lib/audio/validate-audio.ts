import "server-only";

import { AI_CONFIG } from "@/config/ai";

export type AudioErrorCode =
  | "AUDIO_TOO_LARGE"
  | "AUDIO_TOO_LONG"
  | "EMPTY_AUDIO"
  | "INVALID_AUDIO"
  | "UNSUPPORTED_AUDIO";

export class AudioInputError extends Error {
  constructor(
    message: string,
    readonly code: AudioErrorCode,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AudioInputError";
  }
}

export interface ValidatedAudio {
  bytes: Uint8Array;
  durationSeconds: number;
  fileName: string;
  mimeType: string;
}

const mimeExtensions: Record<string, string> = {
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/webm": ".webm",
  "audio/x-wav": ".wav",
};

export async function validateAudioFile(file: File): Promise<ValidatedAudio> {
  if (file.size <= 0) {
    throw new AudioInputError("No audio was captured.", "EMPTY_AUDIO");
  }

  if (file.size > AI_CONFIG.maxAudioBytes) {
    throw new AudioInputError(
      "Voice recordings must be 5 MB or smaller.",
      "AUDIO_TOO_LARGE",
      413,
    );
  }

  const mimeType = file.type.split(";")[0]?.trim().toLowerCase();
  const extension = mimeExtensions[mimeType];
  if (!extension) {
    throw new AudioInputError(
      "This browser's recording format is not supported.",
      "UNSUPPORTED_AUDIO",
      415,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const { parseBuffer } = await import("music-metadata");
    const metadata = await parseBuffer(
      bytes,
      { mimeType, size: file.size },
      { duration: true, skipCovers: true },
    );
    const durationSeconds = metadata.format.duration;

    if (!durationSeconds || !Number.isFinite(durationSeconds)) {
      throw new AudioInputError(
        "The recording duration could not be verified.",
        "INVALID_AUDIO",
        422,
      );
    }

    if (durationSeconds > AI_CONFIG.maxRecordingSeconds + 0.5) {
      throw new AudioInputError(
        `Voice recordings must be ${AI_CONFIG.maxRecordingSeconds} seconds or shorter.`,
        "AUDIO_TOO_LONG",
        413,
      );
    }

    return {
      bytes,
      durationSeconds,
      fileName: `voice-question${extension}`,
      mimeType,
    };
  } catch (error) {
    if (error instanceof AudioInputError) throw error;

    throw new AudioInputError(
      "The recording could not be read. Please try again.",
      "INVALID_AUDIO",
      422,
    );
  }
}
