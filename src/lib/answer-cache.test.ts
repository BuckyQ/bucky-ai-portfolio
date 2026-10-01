import { describe, expect, it, vi } from "vitest";

import { createMemoryAnswerCacheStore } from "./answer-cache-core";
import {
  createSupabaseAnswerCacheStore,
  prepareAnswerCache,
} from "./answer-cache";

const source = {
  id: "bucky-profile-chunk-0",
  title: "Bucky Profile: Overview",
  type: "bucky-profile" as const,
  score: 0.92,
};

describe("Supabase answer-cache store", () => {
  it("parses a cache hit and sends only hashed keys to the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          cache_state: "hit",
          cached_answer: "Bucky builds Applied AI systems.",
          cached_sources: [source],
          cached_created_at: "2026-09-26T10:00:00.000Z",
          cached_expires_at: "2026-10-26T10:00:00.000Z",
        },
      ],
      error: null,
    });
    const store = createSupabaseAnswerCacheStore({ rpc });

    const claim = await store.claim({
      key: "v1:hashed-key",
      ownerToken: "owner-token",
      leaseSeconds: 60,
    });

    expect(claim).toMatchObject({
      status: "hit",
      value: {
        answer: "Bucky builds Applied AI systems.",
        sources: [source],
      },
    });
    expect(rpc).toHaveBeenCalledWith("claim_ask_bucky_answer_cache", {
      p_cache_key: "v1:hashed-key",
      p_lease_owner: "owner-token",
      p_lease_seconds: 60,
    });
  });

  it("stores and releases only through the active lease token", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const store = createSupabaseAnswerCacheStore({ rpc });

    await expect(
      store.store({
        key: "v1:hashed-key",
        ownerToken: "owner-token",
        answer: "Grounded answer",
        sources: [source],
        ttlSeconds: 300,
      }),
    ).resolves.toBe(true);
    await store.release({
      key: "v1:hashed-key",
      ownerToken: "owner-token",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "store_ask_bucky_answer_cache", {
      p_answer: "Grounded answer",
      p_cache_key: "v1:hashed-key",
      p_lease_owner: "owner-token",
      p_sources: [source],
      p_ttl_seconds: 300,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "release_ask_bucky_answer_cache", {
      p_cache_key: "v1:hashed-key",
      p_lease_owner: "owner-token",
    });
  });
});

describe("prepareAnswerCache", () => {
  it("coalesces a waiter onto the owner's stored answer", async () => {
    const store = createMemoryAnswerCacheStore();
    const owner = await prepareAnswerCache("Who is Bucky?", {
      ownerToken: "owner",
      store,
    });
    expect(owner.status).toBe("owner");

    const waiter = prepareAnswerCache(" who is BUCKY ", {
      ownerToken: "waiter",
      pollMilliseconds: 1,
      store,
      waitMilliseconds: 100,
    });

    if (owner.status !== "owner") throw new Error("Expected cache owner.");
    await owner.lease.store({
      answer: "Bucky is an Applied AI Engineer.",
      sources: [source],
    });

    await expect(waiter).resolves.toMatchObject({
      status: "hit",
      value: { answer: "Bucky is an Applied AI Engineer." },
    });
  });

  it("returns busy without starting duplicate work when the wait expires", async () => {
    const store = {
      claim: vi.fn().mockResolvedValue({ status: "pending" as const }),
      store: vi.fn(),
      release: vi.fn(),
    };

    await expect(
      prepareAnswerCache("Who is Bucky?", {
        store,
        waitMilliseconds: 0,
      }),
    ).resolves.toEqual({ status: "busy" });
    expect(store.store).not.toHaveBeenCalled();
  });

  it("can be explicitly disabled", async () => {
    await expect(
      prepareAnswerCache("Who is Bucky?", { store: null }),
    ).resolves.toEqual({ status: "disabled" });
  });
});
