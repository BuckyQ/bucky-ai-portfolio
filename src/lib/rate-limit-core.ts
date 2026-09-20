export interface DailyRateLimitInput {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface DailyRateLimitStoreReservation {
  allowed: boolean;
  count: number;
  resetAt: number;
  release: () => Promise<void>;
}

export interface DailyRateLimitStore {
  reserve(
    input: DailyRateLimitInput,
  ): Promise<DailyRateLimitStoreReservation>;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

export function createMemoryDailyRateLimitStore(
  now: () => number = Date.now,
): DailyRateLimitStore {
  const entries = new Map<string, MemoryEntry>();

  return {
    reserve: async ({ key, limit, windowSeconds }) => {
      if (!key || limit < 1 || windowSeconds < 1) {
        throw new Error("Rate-limit reservation input is invalid.");
      }

      const reservedAt = now();
      const windowMilliseconds = windowSeconds * 1000;
      const existing = entries.get(key);
      const entry =
        existing && existing.resetAt > reservedAt
          ? existing
          : { count: 0, resetAt: reservedAt + windowMilliseconds };

      if (entry.count >= limit) {
        entries.set(key, entry);
        return {
          allowed: false,
          count: entry.count,
          resetAt: entry.resetAt,
          release: async () => undefined,
        };
      }

      entry.count += 1;
      entries.set(key, entry);
      const reservationResetAt = entry.resetAt;
      let released = false;

      return {
        allowed: true,
        count: entry.count,
        resetAt: entry.resetAt,
        release: async () => {
          if (released) return;

          const current = entries.get(key);
          if (current?.resetAt === reservationResetAt) {
            current.count = Math.max(0, current.count - 1);
            if (current.count === 0) entries.delete(key);
          }

          released = true;
        },
      };
    },
  };
}
