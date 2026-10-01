import "server-only";

import { randomUUID } from "node:crypto";

import { AI_CONFIG } from "@/config/ai";
import profileIndexData from "@/data/profile/bucky-profile-index.json";
import {
  createMemoryAnswerCacheStore,
  type AnswerCacheClaim,
  type AnswerCacheStore,
  type CachedAnswer,
  type CachedAnswerSource,
} from "@/lib/answer-cache-core";
import { createAnswerCacheKey } from "@/lib/answer-cache-key";
import {
  getSupabaseAdmin,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import type { ProfileIndex } from "@/lib/rag/index-schema";

interface SupabaseRpcResponse {
  data: unknown;
  error: { message?: string } | null;
}

export interface AnswerCacheRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, unknown>,
  ): PromiseLike<SupabaseRpcResponse>;
}

export interface AnswerCacheLease {
  release(): Promise<void>;
  store(value: {
    answer: string;
    sources: CachedAnswerSource[];
  }): Promise<boolean>;
}

export type PreparedAnswerCache =
  | { status: "hit"; value: CachedAnswer }
  | { status: "owner"; lease: AnswerCacheLease }
  | { status: "busy" }
  | { status: "disabled" };

interface PrepareAnswerCacheOptions {
  ownerToken?: string;
  pollMilliseconds?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  store?: AnswerCacheStore | null;
  waitMilliseconds?: number;
}

const profileIndex = profileIndexData as ProfileIndex;
const memoryAnswerCacheStore = createMemoryAnswerCacheStore();

function parseSources(value: unknown): CachedAnswerSource[] {
  if (!Array.isArray(value)) {
    throw new Error("Shared answer cache returned invalid sources.");
  }

  return value.map((source) => {
    if (
      typeof source !== "object" ||
      source === null ||
      !("id" in source) ||
      !("title" in source) ||
      !("type" in source) ||
      !("score" in source) ||
      typeof source.id !== "string" ||
      typeof source.title !== "string" ||
      source.type !== "bucky-profile" ||
      !Number.isFinite(Number(source.score))
    ) {
      throw new Error("Shared answer cache returned an invalid source.");
    }

    return {
      id: source.id,
      title: source.title,
      type: source.type,
      score: Number(source.score),
    };
  });
}

function parseClaim(data: unknown): AnswerCacheClaim {
  const row = Array.isArray(data) ? data[0] : data;
  if (
    typeof row !== "object" ||
    row === null ||
    !("cache_state" in row) ||
    typeof row.cache_state !== "string"
  ) {
    throw new Error("Shared answer cache returned an invalid claim.");
  }

  if (row.cache_state === "owner" || row.cache_state === "pending") {
    return { status: row.cache_state };
  }

  if (
    row.cache_state !== "hit" ||
    !("cached_answer" in row) ||
    !("cached_sources" in row) ||
    !("cached_created_at" in row) ||
    !("cached_expires_at" in row) ||
    typeof row.cached_answer !== "string"
  ) {
    throw new Error("Shared answer cache returned an invalid hit.");
  }

  const createdAt = Date.parse(String(row.cached_created_at));
  const expiresAt = Date.parse(String(row.cached_expires_at));
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) {
    throw new Error("Shared answer cache returned invalid timestamps.");
  }

  return {
    status: "hit",
    value: {
      answer: row.cached_answer,
      sources: parseSources(row.cached_sources),
      createdAt,
      expiresAt,
    },
  };
}

export function createSupabaseAnswerCacheStore(
  client: AnswerCacheRpcClient,
): AnswerCacheStore {
  return {
    claim: async ({ key, ownerToken, leaseSeconds }) => {
      const { data, error } = await client.rpc(
        "claim_ask_bucky_answer_cache",
        {
          p_cache_key: key,
          p_lease_owner: ownerToken,
          p_lease_seconds: leaseSeconds,
        },
      );

      if (error) throw new Error("Shared answer-cache claim failed.");
      return parseClaim(data);
    },

    store: async ({ key, ownerToken, answer, sources, ttlSeconds }) => {
      const { data, error } = await client.rpc(
        "store_ask_bucky_answer_cache",
        {
          p_answer: answer,
          p_cache_key: key,
          p_lease_owner: ownerToken,
          p_sources: sources,
          p_ttl_seconds: ttlSeconds,
        },
      );

      if (error) throw new Error("Shared answer-cache write failed.");
      const stored = Array.isArray(data) ? data[0] : data;
      return stored === true;
    },

    release: async ({ key, ownerToken }) => {
      const { error } = await client.rpc(
        "release_ask_bucky_answer_cache",
        {
          p_cache_key: key,
          p_lease_owner: ownerToken,
        },
      );

      if (error) throw new Error("Shared answer-cache release failed.");
    },
  };
}

function getCacheSecret(): string {
  const secret =
    process.env.ASK_BUCKY_CACHE_SECRET?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "ask-bucky-local-cache";
  throw new Error("The answer-cache key secret is not configured.");
}

function getSupabaseAnswerCacheStore(): AnswerCacheStore {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase shared answer caching is not configured.");
  }

  return createSupabaseAnswerCacheStore(
    getSupabaseAdmin() as unknown as AnswerCacheRpcClient,
  );
}

function getAnswerCacheStore(): AnswerCacheStore | null {
  const requestedBackend =
    process.env.ASK_BUCKY_ANSWER_CACHE_BACKEND?.trim().toLowerCase();

  if (
    requestedBackend &&
    !["memory", "off", "supabase"].includes(requestedBackend)
  ) {
    throw new Error("ASK_BUCKY_ANSWER_CACHE_BACKEND is invalid.");
  }

  if (requestedBackend === "off") return null;
  if (requestedBackend === "memory") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("In-memory production answer caching is disabled.");
    }
    return memoryAnswerCacheStore;
  }
  if (requestedBackend === "supabase") return getSupabaseAnswerCacheStore();
  if (process.env.NODE_ENV === "production") {
    return getSupabaseAnswerCacheStore();
  }

  return memoryAnswerCacheStore;
}

function buildCacheKey(question: string): string {
  const answerModel =
    process.env.OPENAI_CHAT_MODEL?.trim() || AI_CONFIG.answerModel;
  const retrievalVersion = JSON.stringify({
    embeddingModel: profileIndex.embeddingModel,
    similarityThreshold: AI_CONFIG.similarityThreshold,
    topK: AI_CONFIG.retrievalTopK,
  });

  return createAnswerCacheKey(question, {
    answerModel,
    profileSourceHash: profileIndex.sourceHash,
    promptVersion: AI_CONFIG.answerCacheVersion,
    retrievalVersion,
    secret: getCacheSecret(),
  });
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createLease(
  store: AnswerCacheStore,
  key: string,
  ownerToken: string,
): AnswerCacheLease {
  let settled = false;

  return {
    store: async ({ answer, sources }) => {
      if (settled) return false;
      if (
        !answer.trim() ||
        answer.length > AI_CONFIG.maxCachedAnswerCharacters
      ) {
        throw new Error("The answer is not eligible for caching.");
      }

      const stored = await store.store({
        answer,
        key,
        ownerToken,
        sources,
        ttlSeconds: AI_CONFIG.answerCacheTtlSeconds,
      });
      settled = true;
      return stored;
    },
    release: async () => {
      if (settled) return;
      settled = true;
      await store.release({ key, ownerToken });
    },
  };
}

export async function prepareAnswerCache(
  question: string,
  options: PrepareAnswerCacheOptions = {},
): Promise<PreparedAnswerCache> {
  const store =
    options.store === undefined ? getAnswerCacheStore() : options.store;
  if (!store) return { status: "disabled" };

  const key = buildCacheKey(question);
  const ownerToken = options.ownerToken ?? randomUUID();
  const waitMilliseconds =
    options.waitMilliseconds ?? AI_CONFIG.answerCacheWaitMilliseconds;
  let pollMilliseconds = Math.max(
    1,
    options.pollMilliseconds ?? AI_CONFIG.answerCachePollMilliseconds,
  );
  const sleep = options.sleep ?? defaultSleep;
  const deadline = Date.now() + Math.max(0, waitMilliseconds);

  while (true) {
    const claim = await store.claim({
      key,
      ownerToken,
      leaseSeconds: AI_CONFIG.answerCacheLeaseSeconds,
    });

    if (claim.status === "hit") return claim;
    if (claim.status === "owner") {
      return { status: "owner", lease: createLease(store, key, ownerToken) };
    }
    if (Date.now() >= deadline) return { status: "busy" };

    await sleep(Math.max(1, Math.min(pollMilliseconds, deadline - Date.now())));
    pollMilliseconds = Math.min(
      AI_CONFIG.answerCacheMaxPollMilliseconds,
      Math.ceil(pollMilliseconds * 1.75),
    );
  }
}
