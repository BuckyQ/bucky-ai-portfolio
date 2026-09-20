"use client";

import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { AI_CONFIG } from "@/config/ai";
import { useVoiceQuestion } from "@/hooks/useVoiceQuestion";
import { DOCUMENT_ACCEPT, type TemporaryDocument } from "@/lib/files/types";
import {
  DocumentInputError,
  validateDocumentMetadata,
} from "@/lib/files/validate-file";

interface Source {
  id: string;
  title: string;
  score: number;
  type?: "bucky-profile" | "uploaded-document";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface AskResponse {
  answer?: string;
  code?: "DAILY_LIMIT" | "INSUFFICIENT_CONTEXT" | "OUT_OF_SCOPE";
  error?: string;
  remainingDaily?: number;
  sources?: Source[];
}

interface DocumentResponse {
  document?: TemporaryDocument;
  error?: string;
}

const sessionUsageKey = "ask-bucky-successful-questions";

const topics = ["Experience", "AI Projects", "Technical Skills", "Education"];

const suggestedQuestions = [
  "What AI projects has Bucky built?",
  "What did Bucky work on at Apple?",
  "What experience does Bucky have with RAG?",
];

const documentSuggestedQuestions = [
  "Which of Bucky's projects are relevant to this role?",
  "What skills overlap with Bucky's experience?",
  "Which requirements are not covered by Bucky's public profile?",
];

const initialMessage: Message = {
  id: "intro",
  role: "assistant",
  content:
    "Ask me about Bucky's professional background, projects, skills, or education.",
};

export default function AskBucky() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [successfulQuestions, setSuccessfulQuestions] = useState(0);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [inputMode, setInputMode] = useState<"profile" | "document">("profile");
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [temporaryDocument, setTemporaryDocument] =
    useState<TemporaryDocument | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentRequestInFlight = useRef(false);
  const messageCounter = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const requestInFlight = useRef(false);
  const remainingQuestions = Math.max(
    0,
    AI_CONFIG.sessionQuestionLimit - successfulQuestions,
  );
  const sessionLimitReached = remainingQuestions === 0;
  const assistantDisabled =
    !isSessionReady || sessionLimitReached || dailyLimitReached;
  const voice = useVoiceQuestion({
    disabled: assistantDisabled || isLoading || isDocumentLoading,
    onTranscript: (transcript) => setQuestion(transcript),
  });
  const voiceBusy =
    voice.status === "recording" ||
    voice.status === "requesting" ||
    voice.status === "transcribing";
  const inputDisabled =
    assistantDisabled || isLoading || isDocumentLoading || voiceBusy;
  const activeSuggestions =
    inputMode === "document" ? documentSuggestedQuestions : suggestedQuestions;

  useEffect(() => {
    try {
      const storedCount = Number.parseInt(
        window.sessionStorage.getItem(sessionUsageKey) ?? "0",
        10,
      );

      if (Number.isFinite(storedCount) && storedCount > 0) {
        setSuccessfulQuestions(
          Math.min(storedCount, AI_CONFIG.sessionQuestionLimit),
        );
      }
    } catch {
      // React state still enforces the limit when session storage is unavailable.
    } finally {
      setIsSessionReady(true);
    }
  }, []);

  useEffect(() => {
    const viewport = messagesRef.current;
    if (!viewport) return;

    const scrollToLatest = () => {
      const prefersReducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        return;
      }

      viewport.scrollTop = viewport.scrollHeight;
    };

    if (typeof window.requestAnimationFrame !== "function") {
      scrollToLatest();
      return;
    }

    const frameId = window.requestAnimationFrame(scrollToLatest);
    return () => window.cancelAnimationFrame(frameId);
  }, [isLoading, messages]);

  function nextMessageId(role: Message["role"]): string {
    messageCounter.current += 1;
    return `${role}-${messageCounter.current}`;
  }

  async function askQuestion(rawQuestion: string) {
    const nextQuestion = rawQuestion.trim();
    if (
      !nextQuestion ||
      nextQuestion.length > AI_CONFIG.maxQuestionLength ||
      inputDisabled ||
      requestInFlight.current
    ) {
      return;
    }

    requestInFlight.current = true;
    setSuggestionsExpanded(false);
    setMessages((current) => [
      ...current,
      { id: nextMessageId("user"), role: "user", content: nextQuestion },
    ]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask-bucky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          ...(inputMode === "document" && temporaryDocument
            ? { temporaryDocument }
            : {}),
        }),
      });
      const data = (await response.json()) as AskResponse;

      if (response.status === 429 || data.code === "DAILY_LIMIT") {
        setDailyLimitReached(true);
      }

      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "Unable to answer that question.");
      }

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId("assistant"),
          role: "assistant",
          content: data.answer ?? "",
          sources: data.sources,
        },
      ]);

      setSuccessfulQuestions((currentCount) => {
        const nextSuccessfulCount = Math.min(
          currentCount + 1,
          AI_CONFIG.sessionQuestionLimit,
        );

        try {
          window.sessionStorage.setItem(
            sessionUsageKey,
            String(nextSuccessfulCount),
          );
        } catch {
          // Keep the in-memory session count when storage is unavailable.
        }

        return nextSuccessfulCount;
      });
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId("assistant"),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Ask Bucky is temporarily unavailable.",
        },
      ]);
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askQuestion(question);
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || inputDisabled || documentRequestInFlight.current) return;

    setDocumentError(null);

    try {
      validateDocumentMetadata({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    } catch (error) {
      setDocumentError(
        error instanceof DocumentInputError
          ? error.message
          : "Please select a valid PDF or TXT file.",
      );
      return;
    }

    documentRequestInFlight.current = true;
    setIsDocumentLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/documents/extract", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as DocumentResponse;

      if (!response.ok || !data.document) {
        throw new Error(data.error ?? "The document could not be read.");
      }

      setTemporaryDocument(data.document);
    } catch (error) {
      setTemporaryDocument(null);
      setDocumentError(
        error instanceof Error
          ? error.message
          : "The document could not be read.",
      );
    } finally {
      documentRequestInFlight.current = false;
      setIsDocumentLoading(false);
    }
  }

  const voiceStatusLabel =
    voice.status === "recording"
      ? `Recording... ${voice.recordingSeconds}s / ${AI_CONFIG.maxRecordingSeconds}s`
      : voice.status === "requesting"
        ? "Starting..."
      : voice.status === "transcribing"
        ? "Transcribing..."
        : voice.status === "ready"
          ? "Ready"
          : voice.isSupported === false
            ? "Unavailable"
            : "Idle";

  return (
    <section className="ask-bucky" aria-labelledby="ask-bucky-title">
      <header className="ask-bucky-header">
        <div>
          <span className="ask-bucky-status" aria-hidden="true" />
          <p>Retrieval system / Profile corpus</p>
        </div>
        <h2 id="ask-bucky-title">Ask Bucky AI</h2>
      </header>

      <div className="ask-bucky-modes">
        <div aria-label="Ask Bucky input mode" role="group">
          <button
            aria-pressed={inputMode === "profile"}
            disabled={isLoading || isDocumentLoading || voiceBusy}
            onClick={() => {
              setDocumentError(null);
              setInputMode("profile");
            }}
            type="button"
          >
            Ask about Bucky
          </button>
          <button
            aria-pressed={inputMode === "document"}
            disabled={isLoading || isDocumentLoading || voiceBusy}
            onClick={() => setInputMode("document")}
            type="button"
          >
            Compare a Job / Document
          </button>
        </div>
        <p>
          {inputMode === "document"
            ? "Temporary context / Not stored"
            : "Public profile context"}
        </p>
      </div>

      {inputMode === "document" ? (
        <div className="ask-bucky-document" aria-live="polite">
          <input
            accept={DOCUMENT_ACCEPT}
            aria-label="Upload a PDF or TXT document"
            disabled={inputDisabled}
            hidden
            onChange={handleFileSelection}
            ref={fileInputRef}
            type="file"
          />
          {temporaryDocument ? (
            <div className="ask-bucky-file">
              <FileText aria-hidden="true" />
              <div>
                <strong>{temporaryDocument.fileName}</strong>
                <span>{(temporaryDocument.size / 1024).toFixed(1)} KB / Temporary</span>
              </div>
              <button
                aria-label={`Remove ${temporaryDocument.fileName}`}
                disabled={inputDisabled}
                onClick={() => {
                  setTemporaryDocument(null);
                  setDocumentError(null);
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              className="ask-bucky-upload"
              disabled={inputDisabled}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {isDocumentLoading ? (
                <LoaderCircle aria-hidden="true" className="is-spinning" />
              ) : (
                <Paperclip aria-hidden="true" />
              )}
              <span>{isDocumentLoading ? "Reading document" : "Upload PDF or TXT"}</span>
              <small>5 MB max</small>
            </button>
          )}
          {temporaryDocument ? (
            <p>Ask how Bucky&apos;s experience relates to this document.</p>
          ) : null}
          {documentError ? <p className="ask-bucky-error" role="alert">{documentError}</p> : null}
        </div>
      ) : null}

      <div
        className={`ask-bucky-guide${suggestionsExpanded ? "" : " is-collapsed"}`}
      >
        {suggestionsExpanded ? (
          <div className="ask-bucky-topics">
            <p>Ask about</p>
            <ul>
              {topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
          </div>
        ) : null}
        <div className="ask-bucky-suggestions">
          <div className="ask-bucky-guide-heading">
            <p>Suggested questions</p>
            <button
              aria-controls="ask-bucky-suggestion-list"
              aria-expanded={suggestionsExpanded}
              aria-label={`${suggestionsExpanded ? "Hide" : "Show"} suggested questions`}
              className="ask-bucky-guide-toggle"
              onClick={() => setSuggestionsExpanded((current) => !current)}
              type="button"
            >
              <span>{suggestionsExpanded ? "Hide" : "Show"}</span>
              {suggestionsExpanded ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
            </button>
          </div>
          <div
            className="ask-bucky-suggestion-list"
            hidden={!suggestionsExpanded}
            id="ask-bucky-suggestion-list"
          >
            {activeSuggestions.map((suggestion) => (
              <button
                disabled={inputDisabled}
                key={suggestion}
                onClick={() => void askQuestion(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="ask-bucky-messages"
        aria-live="polite"
        aria-busy={isLoading}
        ref={messagesRef}
      >
        {messages.map((message) => (
          <article className={`ask-bucky-message is-${message.role}`} key={message.id}>
            <span>{message.role === "assistant" ? "Bucky / AI" : "You"}</span>
            <p>{message.content}</p>
            {message.sources && message.sources.length > 0 ? (
              <small>
                Sources / {Array.from(new Set(message.sources.map((source) => source.title))).join(" + ")}
              </small>
            ) : null}
          </article>
        ))}
        {isLoading ? (
          <div className="ask-bucky-loading" role="status">
            <LoaderCircle aria-hidden="true" /> Retrieving verified context
          </div>
        ) : null}
      </div>

      <div className="ask-bucky-input-state" aria-live="polite">
        <span>Voice / {voiceStatusLabel}</span>
        {voice.error ? <p role="alert">{voice.error}</p> : null}
      </div>

      <form className="ask-bucky-form" onSubmit={handleSubmit}>
        <label htmlFor="ask-bucky-question">Question about Bucky</label>
        <div className="ask-bucky-input">
          <button
            aria-label={
              voice.status === "recording"
                ? "Stop recording"
                : "Start voice question"
            }
            aria-pressed={voice.status === "recording"}
            className="ask-bucky-voice"
            data-status={voice.status}
            disabled={
              voice.isSupported !== true ||
              voice.status === "requesting" ||
              voice.status === "transcribing" ||
              (voice.status !== "recording" &&
                (assistantDisabled || isLoading || isDocumentLoading))
            }
            onClick={() => void voice.toggleRecording()}
            title={
              voice.isSupported === false
                ? "Voice input is not supported in this browser"
                : undefined
            }
            type="button"
          >
            {voice.status === "recording" ? (
              <Square aria-hidden="true" />
            ) : voice.status === "transcribing" ? (
              <LoaderCircle aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )}
          </button>
          <input
            aria-describedby="ask-bucky-remaining"
            disabled={inputDisabled}
            id="ask-bucky-question"
            maxLength={AI_CONFIG.maxQuestionLength}
            onChange={(event) => {
              setQuestion(event.target.value);
              voice.resetStatus();
            }}
            placeholder={
              inputMode === "document" && temporaryDocument
                ? "Compare Bucky's experience with this document..."
                : "Ask a question about Bucky..."
            }
            type="text"
            value={question}
          />
        </div>
        <button
          className="ask-bucky-submit"
          disabled={inputDisabled || !question.trim()}
          type="submit"
          aria-label="Send question to Ask Bucky AI"
        >
          <span>Ask</span>
          <ArrowUp aria-hidden="true" />
        </button>
      </form>

      <div className="ask-bucky-usage" id="ask-bucky-remaining" aria-live="polite">
        {!sessionLimitReached && !dailyLimitReached ? (
          <p>
            {remainingQuestions} {remainingQuestions === 1 ? "question" : "questions"} remaining
          </p>
        ) : (
          <div className="ask-bucky-limit">
            <p>
              {dailyLimitReached
                ? "You've reached today's AI demo limit. You can still explore Bucky's projects, GitHub, and experience."
                : "You've reached the demo limit."}
            </p>
            <nav aria-label="Explore more about Bucky">
              <Link href="/#work">View Projects <ArrowUpRight aria-hidden="true" /></Link>
              <a href="https://github.com/BuckyQ" target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
              <Link href="/#contact">Contact Bucky <ArrowUpRight aria-hidden="true" /></Link>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
