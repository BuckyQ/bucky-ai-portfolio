import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import OpenAI from "openai";

import {
  chunkDocument,
  type RagDocument,
} from "../src/lib/rag/chunk";
import {
  PROFILE_INDEX_VERSION,
  type ProfileIndex,
} from "../src/lib/rag/index-schema";

const repoRoot = process.cwd();
const profileDirectory = path.join(repoRoot, "src", "data", "profile");
const indexPath = path.join(profileDirectory, "bucky-profile-index.json");
const chunking = { size: 700, overlap: 100 } as const;
const defaultEmbeddingModel = "text-embedding-3-small";
const checkOnly = process.argv.includes("--check");

interface ProfileSource {
  fileName: string;
  text: string;
}

function sourceOrder(left: string, right: string): number {
  if (left === "bucky-profile.md") return -1;
  if (right === "bucky-profile.md") return 1;
  return left.localeCompare(right);
}

function titleFromMarkdown(text: string, fileName: string): string {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  return path
    .basename(fileName, path.extname(fileName))
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadProfileSources(): Promise<ProfileSource[]> {
  const fileNames = (await readdir(profileDirectory))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort(sourceOrder);

  if (!fileNames.includes("bucky-profile.md")) {
    throw new Error("Missing src/data/profile/bucky-profile.md.");
  }

  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      text: await readFile(path.join(profileDirectory, fileName), "utf8"),
    })),
  );
}

function createSourceHash(sources: ProfileSource[]): string {
  const hash = createHash("sha256");
  hash.update(`profile-index-v${PROFILE_INDEX_VERSION}\n`);
  hash.update(`chunk-size:${chunking.size}\n`);
  hash.update(`chunk-overlap:${chunking.overlap}\n`);

  for (const source of sources) {
    hash.update(`source:${source.fileName}\n`);
    hash.update(source.text);
    hash.update("\n");
  }

  return hash.digest("hex");
}

function toDocuments(sources: ProfileSource[]): RagDocument[] {
  return sources.map(({ fileName, text }) => ({
    id: path.basename(fileName, path.extname(fileName)),
    text,
    metadata: {
      source: fileName,
      title: titleFromMarkdown(text, fileName),
    },
  }));
}

function assertValidIndex(
  value: unknown,
  expectedHash: string,
  expectedSources: string[],
): asserts value is ProfileIndex {
  if (!value || typeof value !== "object") {
    throw new Error("Profile index is not a JSON object.");
  }

  const index = value as Partial<ProfileIndex>;
  if (index.version !== PROFILE_INDEX_VERSION) {
    throw new Error("Profile index version is outdated.");
  }
  if (index.sourceHash !== expectedHash) {
    throw new Error(
      "Profile Markdown changed. Run `npm run rag:index` before building.",
    );
  }
  if (
    index.chunking?.size !== chunking.size ||
    index.chunking.overlap !== chunking.overlap
  ) {
    throw new Error("Profile index uses outdated chunk settings.");
  }
  if (
    !Array.isArray(index.sources) ||
    index.sources.join("\n") !== expectedSources.join("\n")
  ) {
    throw new Error("Profile index source list is outdated.");
  }
  if (!index.embeddingModel || typeof index.embeddingModel !== "string") {
    throw new Error("Profile index is missing its embedding model.");
  }
  if (!Array.isArray(index.chunks) || index.chunks.length === 0) {
    throw new Error("Profile index contains no chunks.");
  }

  const embeddingSize = index.chunks[0]?.embedding.length ?? 0;
  const hasInvalidChunk = index.chunks.some(
    (chunk) =>
      !chunk.id ||
      !chunk.text ||
      !Array.isArray(chunk.embedding) ||
      chunk.embedding.length !== embeddingSize,
  );

  if (embeddingSize === 0 || hasInvalidChunk) {
    throw new Error("Profile index contains invalid embeddings.");
  }
}

async function verifyIndex(
  sourceHash: string,
  sourceNames: string[],
): Promise<void> {
  let rawIndex: string;

  try {
    rawIndex = await readFile(indexPath, "utf8");
  } catch {
    throw new Error(
      "Profile index is missing. Run `npm run rag:index` before building.",
    );
  }

  const index: unknown = JSON.parse(rawIndex);
  assertValidIndex(index, sourceHash, sourceNames);
  console.log(
    `Profile index is current: ${index.chunks.length} chunks using ${index.embeddingModel}.`,
  );
}

async function buildIndex(
  sources: ProfileSource[],
  sourceHash: string,
): Promise<void> {
  loadEnvConfig(repoRoot);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate the profile index.");
  }

  const embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || defaultEmbeddingModel;
  const chunks = toDocuments(sources).flatMap((document) =>
    chunkDocument(document, {
      chunkSize: chunking.size,
      overlap: chunking.overlap,
    }),
  );
  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create({
    model: embeddingModel,
    input: chunks.map((chunk) => chunk.text),
  });
  const embeddings = [...response.data]
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Expected ${chunks.length} embeddings but received ${embeddings.length}.`,
    );
  }

  const index: ProfileIndex = {
    version: PROFILE_INDEX_VERSION,
    embeddingModel,
    generatedAt: new Date().toISOString(),
    sourceHash,
    chunking,
    sources: sources.map((source) => source.fileName),
    chunks: chunks.map((chunk, chunkIndex) => {
      const embedding = embeddings[chunkIndex];
      if (!embedding) throw new Error(`Missing embedding for ${chunk.id}.`);
      return { ...chunk, embedding };
    }),
  };

  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(
    `Generated ${index.chunks.length} chunks from ${index.sources.length} Markdown files using ${index.embeddingModel}.`,
  );
  console.log(`Wrote ${path.relative(repoRoot, indexPath)}.`);
}

async function main(): Promise<void> {
  const sources = await loadProfileSources();
  const sourceHash = createSourceHash(sources);
  const sourceNames = sources.map((source) => source.fileName);

  if (checkOnly) {
    await verifyIndex(sourceHash, sourceNames);
    return;
  }

  await buildIndex(sources, sourceHash);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown indexing error.");
  process.exitCode = 1;
});
