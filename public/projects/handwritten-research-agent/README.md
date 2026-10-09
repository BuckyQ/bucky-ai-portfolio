# Handwritten Research Agent

A small research agent built by Bucky Qian in TypeScript, using the OpenAI client and Zod without an agent orchestration framework. The control loop is written explicitly: decide what to do, execute an action, update shared state, and repeat.

This is a learning project for understanding agent behavior, rather than a production research service.

## What it does

- Chooses between `CONTINUE`, `SEARCH_MORE`, `REPLAN`, and `GENERATE` using structured model output.
- Executes web-search and analysis steps, keeping evidence and analyses in shared state.
- Creates targeted follow-up searches when information is missing.
- Replaces the plan when the model recommends replanning or decision confidence is below `0.6`.
- Runs up to five decision rounds and generates a best-effort answer if no answer was produced.

The sample question asks about OpenAI Agents SDK features, pricing, and production limitations. Its initial plan deliberately covers only features, allowing the decision layer to identify missing coverage.

## Quick start

```bash
npm ci
cp .env.example .env
```

Set `OPENAI_API_KEY` in your local `.env`, then run:

```bash
npm run typecheck
npm run dev
```

Running the agent makes paid API requests. Edit the question and initial plan in `src/index.ts`.

### Model configuration

Decision and web-search modules read `OPENAI_MODEL`, defaulting to `gpt-6-luna`. Analysis and replanning currently specify `gpt-5-nano`; query generation and answer generation specify `gpt-3.5-turbo`. The environment override therefore does not apply to every stage. These are the current code settings, not a guarantee that each model supports the requested API features; review them for your account before running.

## How the loop works

```text
Query + initial plan
        ↓
Structured decision → confidence check
        ↓
CONTINUE | SEARCH_MORE | REPLAN | GENERATE
        ↓
Execute action → update evidence / analyses / plan / answer
        ↓
Repeat until an answer exists or five rounds finish
        ↓
Best-effort generation if the loop produced no answer
```

## Project structure

```text
src/
├── index.ts                    # Entry point: initial state and agent loop
├── agent/                      # Decide and dispatch the next action
│   ├── decision.ts             # Ask the model for an action and confidence
│   ├── control.ts              # Resolve the decision using its confidence
│   └── executor.ts             # Execute actions and advance plan steps
├── actions/                    # Work the agent can perform
│   ├── analyze.ts              # Analyze collected evidence
│   ├── generate.ts             # Generate the final answer
│   ├── replan.ts               # Create a replacement plan
│   ├── searchMore.ts           # Collect additional evidence
│   └── createSearchQuery.ts    # Create a targeted follow-up query
├── tools/
│   └── webSearch.ts            # Web-search tool
├── types/
│   └── agent.ts               # Shared types; structured outputs inferred from schemas
├── schemas/
│   └── agent.ts               # Shared Zod schemas for structured model output
└── utils/
    └── context.ts             # Format evidence and analyses for prompts
```

## Types and structured output

`src/schemas/agent.ts` defines the Zod contracts for decisions, plan steps, and search requests. `src/types/agent.ts` derives their TypeScript types with `z.infer`, alongside the shared state and evidence types. `src/utils/context.ts` formats evidence and analyses for prompts.

## Current boundaries

- `CALCULATE` is accepted by the plan schema but is only a logging placeholder.
- Planned-step failures are recorded as `step-error` evidence and the step pointer advances. Other action or decision failures can still terminate the program.
- State lives in memory. There is no persistence, formal evaluation suite, or application-level retry policy.
- Confidence is model-reported; the threshold is a routing heuristic, not a measured correctness score.
- The five-round limit bounds the control loop, not the total number of API calls or elapsed time. Fallback generation happens outside that loop.
- A best-effort answer can be incomplete, and recorded execution errors should not be treated as factual research evidence.

## Source hygiene

`.env`, dependencies, and generated output are excluded from source sharing. `.env.example` contains placeholders only.
