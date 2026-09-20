import { createServer } from "node:http";

import { createMemoryDailyRateLimitStore } from "../src/lib/rate-limit-core";

const limit = 10;
const windowSeconds = 24 * 60 * 60;
const standardStore = createMemoryDailyRateLimitStore();
const finalSlotStore = createMemoryDailyRateLimitStore();

const server = createServer((request, response) => {
  void (async () => {
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const isFinalSlotScenario = path === "/mock/final-slot";
    const store = isFinalSlotScenario ? finalSlotStore : standardStore;
    const reservation = await store.reserve({
      key: isFinalSlotScenario ? "final-slot" : "standard",
      limit,
      windowSeconds,
    });

    response.statusCode = reservation.allowed ? 200 : 429;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ allowed: reservation.allowed }));
  })().catch(() => {
    response.statusCode = 500;
    response.end(JSON.stringify({ error: "mock server failure" }));
  });
});

async function listen(): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine the local mock server port.");
  }

  return address.port;
}

async function concurrentStatuses(
  url: string,
  requestCount: number,
): Promise<number[]> {
  const responses = await Promise.all(
    Array.from({ length: requestCount }, () =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What did Bucky work on at Apple?",
        }),
      }),
    ),
  );

  return responses.map((response) => response.status);
}

function assertStatusCounts(
  label: string,
  statuses: number[],
  expectedSuccesses: number,
  expectedRateLimits: number,
): void {
  const successes = statuses.filter((status) => status === 200).length;
  const rateLimits = statuses.filter((status) => status === 429).length;

  if (successes !== expectedSuccesses || rateLimits !== expectedRateLimits) {
    throw new Error(
      `${label} failed: expected ${expectedSuccesses} successes and ${expectedRateLimits} rate limits, received ${successes} and ${rateLimits}.`,
    );
  }

  console.log(
    `${label}: ${successes} allowed, ${rateLimits} rate-limited (passed)`,
  );
}

async function main(): Promise<void> {
  for (let index = 0; index < limit - 1; index += 1) {
    await finalSlotStore.reserve({
      key: "final-slot",
      limit,
      windowSeconds,
    });
  }

  const port = await listen();
  try {
    const origin = `http://127.0.0.1:${port}`;
    const standardStatuses = await concurrentStatuses(
      `${origin}/mock/standard`,
      20,
    );
    assertStatusCounts("20-request burst", standardStatuses, 10, 10);

    const finalSlotStatuses = await concurrentStatuses(
      `${origin}/mock/final-slot`,
      5,
    );
    assertStatusCounts(
      "five contenders for one slot",
      finalSlotStatuses,
      1,
      4,
    );

    console.log(
      "Safe mode used a local mock endpoint only; OpenAI and Supabase were not contacted.",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Concurrency test failed.",
  );
  process.exitCode = 1;
});
