import { afterEach, describe, expect, it, vi } from "vitest";

import { AI_CONFIG } from "@/config/ai";

import { createMemoryDailyRateLimitStore } from "./rate-limit-core";
import {
  createSupabaseDailyRateLimitStore,
  reserveAiOperation,
  reserveAiQuestion,
  type RateLimitRpcClient,
} from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("daily rate limiting", () => {
  it("allows the first ten reservations and denies the eleventh", async () => {
    const store = createMemoryDailyRateLimitStore(() => 1_000);
    const reservations = [];

    for (let index = 0; index < AI_CONFIG.dailyIpLimit; index += 1) {
      reservations.push(
        await store.reserve({
          key: "same-visitor",
          limit: AI_CONFIG.dailyIpLimit,
          windowSeconds: AI_CONFIG.dailyIpWindowSeconds,
        }),
      );
    }

    const denied = await store.reserve({
      key: "same-visitor",
      limit: AI_CONFIG.dailyIpLimit,
      windowSeconds: AI_CONFIG.dailyIpWindowSeconds,
    });

    expect(reservations.every((reservation) => reservation.allowed)).toBe(true);
    expect(reservations.at(-1)?.count).toBe(10);
    expect(denied).toMatchObject({ allowed: false, count: 10 });
  });

  it("allows only one of five concurrent reservations for the final slot", async () => {
    const store = createMemoryDailyRateLimitStore(() => 2_000);
    const input = {
      key: "final-slot",
      limit: 10,
      windowSeconds: 86_400,
    };

    for (let index = 0; index < 9; index += 1) {
      await store.reserve(input);
    }

    const contenders = await Promise.all(
      Array.from({ length: 5 }, () => store.reserve(input)),
    );

    expect(contenders.filter((reservation) => reservation.allowed)).toHaveLength(1);
    expect(contenders.filter((reservation) => !reservation.allowed)).toHaveLength(4);
  });

  it("releases rejected reservations once so they do not consume quota", async () => {
    const store = createMemoryDailyRateLimitStore(() => 3_000);
    const input = { key: "release", limit: 1, windowSeconds: 60 };
    const first = await store.reserve(input);

    await first.release();
    await first.release();
    const replacement = await store.reserve(input);

    expect(first.allowed).toBe(true);
    expect(replacement).toMatchObject({ allowed: true, count: 1 });
  });

  it("maps an atomic store reservation to the public rate-limit result", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const store = {
      reserve: vi.fn().mockResolvedValue({
        allowed: true,
        count: 4,
        resetAt: Date.now() + 60_000,
        release,
      }),
    };
    const request = new Request("http://localhost/api/ask-bucky", {
      headers: { "x-forwarded-for": "198.51.100.7, 10.0.0.1" },
    });

    const result = await reserveAiQuestion(request, store);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(6);
    expect(store.reserve).toHaveBeenCalledOnce();
    expect(store.reserve.mock.calls[0]?.[0].key).toMatch(
      /^ask-bucky:daily:[a-f0-9]{64}$/,
    );
  });

  it("isolates voice and document operation namespaces", async () => {
    const store = createMemoryDailyRateLimitStore(() => 4_000);
    const request = new Request("http://localhost/api/transcribe", {
      headers: { "x-forwarded-for": "198.51.100.9" },
    });

    const voice = await reserveAiOperation(
      request,
      { namespace: "voice-active", limit: 1, windowSeconds: 60 },
      store,
    );
    const document = await reserveAiOperation(
      request,
      { namespace: "document-active", limit: 1, windowSeconds: 60 },
      store,
    );

    expect(voice.allowed).toBe(true);
    expect(document.allowed).toBe(true);
  });

  it("refuses the process-memory backend in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ASK_BUCKY_RATE_LIMIT_BACKEND", "memory");

    await expect(
      reserveAiQuestion(new Request("https://buckyqian.com/api/ask-bucky")),
    ).rejects.toThrow("In-memory production rate limiting is disabled.");
  });
});

describe("Supabase shared rate-limit adapter", () => {
  it("reserves with one RPC and releases with a separate atomic RPC", async () => {
    const resetAt = "2026-09-21T12:00:00.000Z";
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ allowed: true, current_count: 9, reset_at: resetAt }],
        error: null,
      })
      .mockResolvedValueOnce({ data: 8, error: null });
    const store = createSupabaseDailyRateLimitStore({
      rpc,
    } as unknown as RateLimitRpcClient);

    const reservation = await store.reserve({
      key: "hashed-identifier",
      limit: 10,
      windowSeconds: 86_400,
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenNthCalledWith(1, "reserve_ask_bucky_daily_limit", {
      p_identifier_hash: "hashed-identifier",
      p_limit: 10,
      p_window_seconds: 86_400,
    });
    expect(reservation).toMatchObject({
      allowed: true,
      count: 9,
      resetAt: Date.parse(resetAt),
    });

    await reservation.release();
    await reservation.release();

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(2, "release_ask_bucky_daily_limit", {
      p_identifier_hash: "hashed-identifier",
      p_reset_at: resetAt,
    });
  });

  it("fails closed when the shared store returns malformed data", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const store = createSupabaseDailyRateLimitStore({
      rpc,
    } as unknown as RateLimitRpcClient);

    await expect(
      store.reserve({ key: "visitor", limit: 10, windowSeconds: 86_400 }),
    ).rejects.toThrow("Shared rate-limit reservation failed.");
  });
});
