import "server-only";

import { createHash } from "node:crypto";

import { AI_CONFIG } from "@/config/ai";
import {
  createMemoryDailyRateLimitStore,
  type DailyRateLimitStore,
} from "@/lib/rate-limit-core";
import {
  getSupabaseAdmin,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

interface UpstashConfig {
  url: string;
  token: string;
}

interface UpstashResponse {
  result?: unknown;
  error?: string;
}

interface SupabaseRpcResponse {
  data: unknown;
  error: { message?: string } | null;
}

export interface RateLimitRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, unknown>,
  ): PromiseLike<SupabaseRpcResponse>;
}

export interface RateLimitReservation {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  release: () => Promise<void>;
}

const memoryRateLimitStore = createMemoryDailyRateLimitStore();

const reserveScript = `
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local ttl = tonumber(redis.call("TTL", KEYS[1]))

if current >= limit then
  if ttl < 1 then
    redis.call("EXPIRE", KEYS[1], window)
    ttl = window
  end
  return {0, current, ttl}
end

local next = redis.call("INCR", KEYS[1])
if next == 1 or ttl < 1 then
  redis.call("EXPIRE", KEYS[1], window)
  ttl = window
end

return {1, next, ttl}
`;

const releaseScript = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
if current <= 1 then
  redis.call("DEL", KEYS[1])
  return 0
end
return redis.call("DECR", KEYS[1])
`;

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url && !token) return null;
  if (!url || !token) {
    throw new Error(
      "Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.",
    );
  }

  return { url: url.replace(/\/$/, ""), token };
}

function getRateLimitKey(request: Request, namespace: string): string {
  const forwardedFor =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-development";
  const fingerprint = createHash("sha256")
    .update(`ask-bucky:${namespace}:${clientIp}`)
    .digest("hex");

  return `ask-bucky:${namespace}:${fingerprint}`;
}

async function upstashCommand(
  config: UpstashConfig,
  command: string[],
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const payload = (await response.json()) as UpstashResponse;

  if (!response.ok || payload.error) {
    throw new Error("Shared rate-limit service is unavailable.");
  }

  return payload.result;
}

function createUpstashDailyRateLimitStore(
  config: UpstashConfig,
): DailyRateLimitStore {
  return {
    reserve: async ({ key, limit, windowSeconds }) => {
      const result = await upstashCommand(config, [
        "EVAL",
        reserveScript,
        "1",
        key,
        String(limit),
        String(windowSeconds),
      ]);

      if (!Array.isArray(result) || result.length < 3) {
        throw new Error("Shared rate-limit service returned an invalid response.");
      }

      const allowed = Number(result[0]) === 1;
      const count = Number(result[1]);
      const ttlSeconds = Math.max(1, Number(result[2]));
      let released = false;

      return {
        allowed,
        count,
        resetAt: Date.now() + ttlSeconds * 1000,
        release: async () => {
          if (!allowed || released) return;
          await upstashCommand(config, ["EVAL", releaseScript, "1", key]);
          released = true;
        },
      };
    },
  };
}

export function createSupabaseDailyRateLimitStore(
  client: RateLimitRpcClient,
): DailyRateLimitStore {
  return {
    reserve: async ({ key, limit, windowSeconds }) => {
      const { data, error } = await client.rpc(
        "reserve_ask_bucky_daily_limit",
        {
          p_identifier_hash: key,
          p_limit: limit,
          p_window_seconds: windowSeconds,
        },
      );

      const row = Array.isArray(data) ? data[0] : data;
      if (
        error ||
        typeof row !== "object" ||
        row === null ||
        !("allowed" in row) ||
        !("current_count" in row) ||
        !("reset_at" in row)
      ) {
        throw new Error("Shared rate-limit reservation failed.");
      }

      const allowed = row.allowed === true;
      const count = Number(row.current_count);
      const resetAtValue = String(row.reset_at);
      const resetAt = Date.parse(resetAtValue);

      if (!Number.isFinite(count) || !Number.isFinite(resetAt)) {
        throw new Error("Shared rate-limit reservation was invalid.");
      }

      let released = false;

      return {
        allowed,
        count,
        resetAt,
        release: async () => {
          if (!allowed || released) return;

          const releaseResult = await client.rpc(
            "release_ask_bucky_daily_limit",
            {
              p_identifier_hash: key,
              p_reset_at: resetAtValue,
            },
          );

          if (releaseResult.error) {
            throw new Error("Shared rate-limit release failed.");
          }

          released = true;
        },
      };
    },
  };
}

function getSupabaseRateLimitStore(): DailyRateLimitStore {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase shared rate limiting is not configured.");
  }

  return createSupabaseDailyRateLimitStore(
    getSupabaseAdmin() as unknown as RateLimitRpcClient,
  );
}

function getDailyRateLimitStore(): DailyRateLimitStore {
  const requestedBackend =
    process.env.ASK_BUCKY_RATE_LIMIT_BACKEND?.trim().toLowerCase();
  const upstashConfig = getUpstashConfig();

  if (
    requestedBackend &&
    !["memory", "supabase", "upstash"].includes(requestedBackend)
  ) {
    throw new Error("ASK_BUCKY_RATE_LIMIT_BACKEND is invalid.");
  }

  if (requestedBackend === "memory") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("In-memory production rate limiting is disabled.");
    }
    return memoryRateLimitStore;
  }

  if (requestedBackend === "upstash") {
    if (!upstashConfig) throw new Error("Upstash rate limiting is not configured.");
    return createUpstashDailyRateLimitStore(upstashConfig);
  }

  if (requestedBackend === "supabase") {
    return getSupabaseRateLimitStore();
  }

  if (upstashConfig) return createUpstashDailyRateLimitStore(upstashConfig);

  if (process.env.NODE_ENV === "production") {
    return getSupabaseRateLimitStore();
  }

  return memoryRateLimitStore;
}

export async function reserveAiOperation(
  request: Request,
  options: { namespace: string; limit: number; windowSeconds: number },
  store: DailyRateLimitStore = getDailyRateLimitStore(),
): Promise<RateLimitReservation> {
  if (!/^[a-z0-9-]{1,24}$/.test(options.namespace)) {
    throw new Error("Rate-limit namespace is invalid.");
  }

  const reservation = await store.reserve({
    key: getRateLimitKey(request, options.namespace),
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  return {
    allowed: reservation.allowed,
    remaining: Math.max(0, options.limit - reservation.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((reservation.resetAt - Date.now()) / 1000),
    ),
    release: reservation.release,
  };
}

export async function reserveAiQuestion(
  request: Request,
  store: DailyRateLimitStore = getDailyRateLimitStore(),
): Promise<RateLimitReservation> {
  return reserveAiOperation(
    request,
    {
      namespace: "daily",
      limit: AI_CONFIG.dailyIpLimit,
      windowSeconds: AI_CONFIG.dailyIpWindowSeconds,
    },
    store,
  );
}
