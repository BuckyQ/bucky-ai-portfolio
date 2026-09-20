# Bucky Qian Portfolio

Next.js and TypeScript portfolio for Bucky Qian, including the server-side
Ask Bucky retrieval-augmented generation (RAG) assistant.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site and API route run
from the same Next.js process; a separate backend command is not required.

Ask Bucky needs `OPENAI_API_KEY` in `.env.local` for real local answers. Keep
all API keys server-side and never prefix them with `NEXT_PUBLIC_`.

## RAG Data

The public source documents live in `src/data/profile/`. Their precomputed
embeddings are checked into `src/data/profile/bucky-profile-index.json`.
Runtime requests load that index, create one embedding for the user's query,
retrieve the top chunks, and make at most one answer-generation call.

After changing profile Markdown, rebuild the index:

```bash
npm run rag:index
```

`npm run build` runs `rag:check` and fails if the checked-in index no longer
matches its source documents. It does not regenerate profile embeddings.

## Automated Tests

Run the complete deterministic suite:

```bash
npm run test
```

Run in watch mode:

```bash
npm run test:watch
```

Run the safe concurrency exercise:

```bash
npm run test:concurrency
```

The concurrency command starts an ephemeral loopback-only mock HTTP server. It
sends a 20-request burst and then lets five requests contend for one final
quota slot. It never calls OpenAI, Supabase, or the deployed website.

Unit and component tests mock OpenAI, Supabase, Next.js deferred work, and
browser `fetch`. They require no environment variables and make no external
API calls. Coverage includes:

- request validation and safe API errors
- no-result, low-similarity, out-of-scope, and missing-profile fallbacks
- one query embedding plus one generation call for a valid answer
- use of the checked-in profile embedding index
- non-blocking unanswered-question logging
- three successful questions per browser session
- double-submit protection
- ten daily successful answers and atomic final-slot contention
- server-only secret boundaries

## Production Configuration

Required for real answers:

```text
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_SECRET_KEY
```

Apply both SQL files in `supabase/migrations/` before deploying. The rate-limit
migration installs atomic Postgres RPC functions used by Vercel instances.
Production fails closed if no shared rate-limit backend is configured; it never
falls back to process memory.

Optional overrides:

```text
OPENAI_CHAT_MODEL
OPENAI_EMBEDDING_MODEL
ASK_BUCKY_RATE_LIMIT_BACKEND=supabase|upstash
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Supabase is the default production rate-limit backend. If both Upstash values
are present, Upstash is selected unless `ASK_BUCKY_RATE_LIMIT_BACKEND` is set
to `supabase`. Local development and tests use the in-memory adapter unless a
backend is explicitly selected.

The API reserves a quota slot atomically before OpenAI work. A grounded answer
keeps the reservation; rejected questions and server failures release it. This
prevents concurrent requests from all seeing the same final slot. There is a
small operational risk if a shared-store release itself remains unavailable:
the reservation can remain counted until its 24-hour window resets. This
fails toward cost protection rather than allowing extra AI calls.

## Manual Production Smoke Test

Run these once after deploying, not as an automated load test:

1. Ask `What did Bucky work on at Apple?` and expect a grounded answer.
2. Ask `What experience does Bucky have with RAG?` and expect a grounded answer.
3. Ask `Has Bucky deployed Kubernetes clusters in production?`; if absent from
   the profile, expect the public-profile fallback and verify one review row in
   Supabase `unanswered_questions`.
4. Ask `What is today's weather?` and expect a scope rejection with no invented
   answer and no stored feedback row.
5. In a controlled preview environment, verify the fourth successful browser
   question is disabled and the eleventh daily reservation returns HTTP 429.

Do not run the concurrency script against the production API. The current
identifier is a hashed forwarded IP, so users behind a shared NAT may share a
daily allowance. For this portfolio-sized workload that tradeoff is accepted;
authenticated per-user limits would be a future improvement if the assistant
becomes a larger product.
