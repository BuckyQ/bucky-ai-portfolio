"use client";

import { ArrowUp, ArrowUpRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { AI_CONFIG } from "@/config/ai";

interface Source {
  id: string;
  title: string;
  score: number;
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

const sessionUsageKey = "ask-bucky-successful-questions";

const topics = ["Experience", "AI Projects", "Technical Skills", "Education"];

const suggestedQuestions = [
  "What AI projects has Bucky built?",
  "What did Bucky work on at Apple?",
  "What experience does Bucky have with RAG?",
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
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [successfulQuestions, setSuccessfulQuestions] = useState(0);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const messageCounter = useRef(0);
  const requestInFlight = useRef(false);
  const remainingQuestions = Math.max(
    0,
    AI_CONFIG.sessionQuestionLimit - successfulQuestions,
  );
  const sessionLimitReached = remainingQuestions === 0;
  const inputDisabled =
    !isSessionReady || isLoading || sessionLimitReached || dailyLimitReached;

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
        body: JSON.stringify({ question: nextQuestion }),
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

  return (
    <section className="ask-bucky" aria-labelledby="ask-bucky-title">
      <header className="ask-bucky-header">
        <div>
          <span className="ask-bucky-status" aria-hidden="true" />
          <p>Retrieval system / Profile corpus</p>
        </div>
        <h2 id="ask-bucky-title">Ask Bucky AI</h2>
      </header>

      <div className="ask-bucky-guide">
        <div className="ask-bucky-topics">
          <p>Ask about</p>
          <ul>
            {topics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
        </div>
        <div className="ask-bucky-suggestions">
          <p>Suggested questions</p>
          <div>
            {suggestedQuestions.map((suggestion) => (
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

      <div className="ask-bucky-messages" aria-live="polite" aria-busy={isLoading}>
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

      <form className="ask-bucky-form" onSubmit={handleSubmit}>
        <label htmlFor="ask-bucky-question">Question</label>
        <input
          aria-describedby="ask-bucky-remaining"
          disabled={inputDisabled}
          id="ask-bucky-question"
          maxLength={AI_CONFIG.maxQuestionLength}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about Bucky..."
          type="text"
          value={question}
        />
        <button
          disabled={inputDisabled || !question.trim()}
          type="submit"
          aria-label="Ask Bucky"
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
