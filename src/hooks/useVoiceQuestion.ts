"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { AI_CONFIG } from "@/config/ai";

export type VoiceStatus =
  | "idle"
  | "ready"
  | "recording"
  | "requesting"
  | "transcribing";

interface TranscriptionResponse {
  error?: string;
  transcript?: string;
}

interface UseVoiceQuestionOptions {
  disabled: boolean;
  onTranscript: (transcript: string) => void;
}

function preferredRecordingType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  if (typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function recordingExtension(mimeType: string): string {
  if (mimeType.startsWith("audio/mp4")) return "m4a";
  if (mimeType.startsWith("audio/ogg")) return "ogg";
  return "webm";
}

function subscribeToVoiceSupport(): () => void {
  return () => undefined;
}

function getVoiceSupport(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function useVoiceQuestion({
  disabled,
  onTranscript,
}: UseVoiceQuestionOptions) {
  const [error, setError] = useState<string | null>(null);
  const isSupported = useSyncExternalStore(
    subscribeToVoiceSupport,
    getVoiceSupport,
    () => null,
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    if (!blob.size) {
      setError("No audio was captured.");
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus("transcribing");

    try {
      const formData = new FormData();
      formData.append(
        "audio",
        blob,
        `voice-question.${recordingExtension(blob.type)}`,
      );
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = (await response.json()) as TranscriptionResponse;

      if (!response.ok || !data.transcript?.trim()) {
        throw new Error(data.error ?? "Voice transcription failed.");
      }

      if (!isMountedRef.current) return;
      onTranscript(data.transcript.trim());
      setStatus("ready");
    } catch (transcriptionError) {
      if (!isMountedRef.current || controller.signal.aborted) return;
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Voice transcription failed.",
      );
      setStatus("idle");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    clearTimers();
    setStatus("transcribing");
    recorder.stop();
  }, [clearTimers]);

  const startRecording = useCallback(async () => {
    if (
      disabled ||
      startingRef.current ||
      status === "requesting" ||
      status === "transcribing"
    ) {
      return;
    }
    if (status === "recording") {
      stopRecording();
      return;
    }

    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    startingRef.current = true;
    setError(null);
    setRecordingSeconds(0);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = preferredRecordingType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        clearTimers();
        recorder.ondataavailable = null;
        recorder.onstop = () => {
          stopTracks();
          mediaRecorderRef.current = null;
          chunksRef.current = [];
        };
        if (recorder.state !== "inactive") recorder.stop();
        stopTracks();
        setError("Recording failed. Please try again.");
        setStatus("idle");
      };
      recorder.onstop = () => {
        clearTimers();
        stopTracks();
        mediaRecorderRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (isMountedRef.current) void transcribe(blob);
      };

      recorder.start(250);
      setStatus("recording");
      intervalRef.current = window.setInterval(
        () =>
          setRecordingSeconds((seconds) =>
            Math.min(seconds + 1, AI_CONFIG.maxRecordingSeconds),
          ),
        1_000,
      );
      timeoutRef.current = window.setTimeout(
        stopRecording,
        AI_CONFIG.maxRecordingSeconds * 1_000,
      );
    } catch (recordingError) {
      stopTracks();
      const permissionDenied =
        recordingError instanceof DOMException &&
        ["NotAllowedError", "SecurityError"].includes(recordingError.name);
      setError(
        permissionDenied
          ? "Microphone permission was denied. Enable it in your browser to use voice input."
          : "The microphone could not be started.",
      );
      setStatus("idle");
    } finally {
      startingRef.current = false;
    }
  }, [clearTimers, disabled, status, stopRecording, stopTracks, transcribe]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
      abortControllerRef.current?.abort();
      const recorder = mediaRecorderRef.current;
      recorder?.stop();
      recorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [clearTimers]);

  return {
    error,
    isSupported,
    recordingSeconds,
    resetStatus: () => {
      setError(null);
      if (status === "ready") setStatus("idle");
    },
    status,
    toggleRecording: startRecording,
  };
}
