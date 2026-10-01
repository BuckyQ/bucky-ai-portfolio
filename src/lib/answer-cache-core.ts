export interface CachedAnswerSource {
  id: string;
  title: string;
  type: "bucky-profile";
  score: number;
}

export interface CachedAnswer {
  answer: string;
  sources: CachedAnswerSource[];
  createdAt: number;
  expiresAt: number;
}

export type AnswerCacheClaim =
  | { status: "hit"; value: CachedAnswer }
  | { status: "owner" }
  | { status: "pending" };

export interface AnswerCacheClaimInput {
  key: string;
  ownerToken: string;
  leaseSeconds: number;
}

export interface AnswerCacheStoreInput {
  key: string;
  ownerToken: string;
  answer: string;
  sources: CachedAnswerSource[];
  ttlSeconds: number;
}

export interface AnswerCacheStore {
  claim(input: AnswerCacheClaimInput): Promise<AnswerCacheClaim>;
  store(input: AnswerCacheStoreInput): Promise<boolean>;
  release(input: { key: string; ownerToken: string }): Promise<void>;
}

interface MemoryCacheEntry {
  answer?: string;
  sources?: CachedAnswerSource[];
  createdAt?: number;
  expiresAt?: number;
  leaseOwner?: string;
  leaseExpiresAt?: number;
}

function cloneSources(sources: CachedAnswerSource[]): CachedAnswerSource[] {
  return sources.map((source) => ({ ...source }));
}

function validateClaimInput(input: AnswerCacheClaimInput): void {
  if (!input.key || !input.ownerToken || input.leaseSeconds < 1) {
    throw new Error("Answer-cache claim input is invalid.");
  }
}

export function createMemoryAnswerCacheStore(
  now: () => number = Date.now,
): AnswerCacheStore {
  const entries = new Map<string, MemoryCacheEntry>();

  return {
    claim: async (input) => {
      validateClaimInput(input);
      const claimedAt = now();
      const existing = entries.get(input.key);

      if (
        existing?.answer &&
        existing.sources &&
        existing.createdAt !== undefined &&
        existing.expiresAt !== undefined &&
        existing.expiresAt > claimedAt
      ) {
        return {
          status: "hit",
          value: {
            answer: existing.answer,
            sources: cloneSources(existing.sources),
            createdAt: existing.createdAt,
            expiresAt: existing.expiresAt,
          },
        };
      }

      if (
        existing?.leaseOwner &&
        existing.leaseExpiresAt !== undefined &&
        existing.leaseExpiresAt > claimedAt
      ) {
        return { status: "pending" };
      }

      entries.set(input.key, {
        leaseOwner: input.ownerToken,
        leaseExpiresAt: claimedAt + input.leaseSeconds * 1_000,
      });

      return { status: "owner" };
    },

    store: async (input) => {
      if (
        !input.key ||
        !input.ownerToken ||
        !input.answer.trim() ||
        input.ttlSeconds < 1
      ) {
        throw new Error("Answer-cache store input is invalid.");
      }

      const existing = entries.get(input.key);
      if (existing?.leaseOwner !== input.ownerToken) return false;

      const storedAt = now();
      entries.set(input.key, {
        answer: input.answer,
        sources: cloneSources(input.sources),
        createdAt: storedAt,
        expiresAt: storedAt + input.ttlSeconds * 1_000,
      });
      return true;
    },

    release: async ({ key, ownerToken }) => {
      const existing = entries.get(key);
      if (existing?.leaseOwner === ownerToken) entries.delete(key);
    },
  };
}
