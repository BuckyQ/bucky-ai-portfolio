import { toFile } from "openai";

import { AI_CONFIG } from "@/config/ai";
import {
  AudioInputError,
  validateAudioFile,
} from "@/lib/audio/validate-audio";
import { reserveAiOperation } from "@/lib/rate-limit";
import { getOpenAIClient } from "@/lib/rag/embedding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > AI_CONFIG.maxAudioBytes + 256 * 1024) {
    return json(
      { error: "Voice recordings must be 5 MB or smaller." },
      { status: 413 },
    );
  }

  let audio: File;
  try {
    const formData = await request.formData();
    const candidate = formData.get("audio");
    if (!(candidate instanceof File)) {
      return json({ error: "Please provide a voice recording." }, { status: 400 });
    }
    audio = candidate;
  } catch {
    return json({ error: "The voice request could not be read." }, { status: 400 });
  }

  try {
    const validatedAudio = await validateAudioFile(audio);
    const inFlight = await reserveAiOperation(request, {
      namespace: "voice-active",
      limit: 1,
      windowSeconds: AI_CONFIG.operationLockSeconds,
    });

    if (!inFlight.allowed) {
      return json(
        { error: "Another voice request is already being processed." },
        { status: 429, headers: { "Retry-After": "3" } },
      );
    }

    try {
      const upload = await toFile(
        validatedAudio.bytes,
        validatedAudio.fileName,
        { type: validatedAudio.mimeType },
      );
      const voiceAllowance = await reserveAiOperation(request, {
        namespace: "voice-daily",
        limit: AI_CONFIG.transcriptionDailyIpLimit,
        windowSeconds: AI_CONFIG.dailyIpWindowSeconds,
      });

      if (!voiceAllowance.allowed) {
        return json(
          { error: "You've reached today's voice demo limit." },
          {
            status: 429,
            headers: {
              "Retry-After": String(voiceAllowance.retryAfterSeconds),
            },
          },
        );
      }

      const transcription = await getOpenAIClient().audio.transcriptions.create({
        file: upload,
        model:
          process.env.OPENAI_TRANSCRIPTION_MODEL ??
          AI_CONFIG.transcriptionModel,
        response_format: "json",
      });
      const transcript = transcription.text.trim();

      if (!transcript) {
        return json(
          { error: "No speech was detected. Please try again." },
          { status: 422 },
        );
      }

      if (transcript.length > AI_CONFIG.maxQuestionLength) {
        return json(
          {
            error: `The transcript is longer than ${AI_CONFIG.maxQuestionLength} characters. Please ask a shorter question.`,
          },
          { status: 422 },
        );
      }

      return json({ transcript });
    } finally {
      await inFlight.release();
    }
  } catch (error) {
    if (error instanceof AudioInputError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }

    console.error("Ask Bucky voice transcription failed.");
    return json(
      { error: "Voice transcription is temporarily unavailable." },
      { status: 503 },
    );
  }
}
