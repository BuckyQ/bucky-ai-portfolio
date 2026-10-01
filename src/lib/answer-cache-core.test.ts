import { describe, expect, it } from "vitest";

import { createMemoryAnswerCacheStore } from "./answer-cache-core";

const source = {
  id: "profile-chunk-0",
  title: "Bucky Profile: Overview",
  type: "bucky-profile" as const,
  score: 0.91,
};

describe("memory answer cache", () => {
  it("allows only one owner for concurrent misses", async () => {
    const store = createMemoryAnswerCacheStore();
    const claims = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.claim({
          key: "same-question",
          ownerToken: `owner-${index}`,
          leaseSeconds: 60,
        }),
      ),
    );

    expect(claims.filter((claim) => claim.status === "owner")).toHaveLength(1);
    expect(claims.filter((claim) => claim.status === "pending")).toHaveLength(19);
  });

  it("serves the stored answer to later callers", async () => {
    let now = 1_000;
    const store = createMemoryAnswerCacheStore(() => now);
    await store.claim({
      key: "question",
      ownerToken: "owner",
      leaseSeconds: 60,
    });
    await store.store({
      key: "question",
      ownerToken: "owner",
      answer: "Grounded answer",
      sources: [source],
      ttlSeconds: 300,
    });

    now += 10_000;
    const claim = await store.claim({
      key: "question",
      ownerToken: "next-owner",
      leaseSeconds: 60,
    });

    expect(claim).toEqual({
      status: "hit",
      value: {
        answer: "Grounded answer",
        sources: [source],
        createdAt: 1_000,
        expiresAt: 301_000,
      },
    });
  });

  it("lets another request take over after release or lease expiry", async () => {
    let now = 1_000;
    const store = createMemoryAnswerCacheStore(() => now);
    await store.claim({
      key: "released",
      ownerToken: "first",
      leaseSeconds: 60,
    });
    await store.release({ key: "released", ownerToken: "first" });

    expect(
      await store.claim({
        key: "released",
        ownerToken: "second",
        leaseSeconds: 60,
      }),
    ).toEqual({ status: "owner" });

    await store.claim({
      key: "expired",
      ownerToken: "first",
      leaseSeconds: 1,
    });
    now += 1_001;

    expect(
      await store.claim({
        key: "expired",
        ownerToken: "second",
        leaseSeconds: 60,
      }),
    ).toEqual({ status: "owner" });
  });

  it("invalidates expired answers", async () => {
    let now = 1_000;
    const store = createMemoryAnswerCacheStore(() => now);
    await store.claim({
      key: "question",
      ownerToken: "first",
      leaseSeconds: 60,
    });
    await store.store({
      key: "question",
      ownerToken: "first",
      answer: "Old answer",
      sources: [source],
      ttlSeconds: 1,
    });
    now += 1_001;

    expect(
      await store.claim({
        key: "question",
        ownerToken: "second",
        leaseSeconds: 60,
      }),
    ).toEqual({ status: "owner" });
  });
});
