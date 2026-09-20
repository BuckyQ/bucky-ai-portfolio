import "server-only";

import { AI_CONFIG } from "@/config/ai";
import type { TemporaryDocument } from "@/lib/files/types";

import { chunkDocument } from "./chunk";
import type { RetrievedChunk } from "./retrieve";

const stopWords = new Set([
  "a",
  "about",
  "and",
  "are",
  "as",
  "at",
  "be",
  "bucky",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "what",
  "which",
  "with",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}+#.-]{2,}/gu) ?? []).filter(
    (token) => !stopWords.has(token),
  );
}

function lexicalScore(text: string, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;

  const textTerms = tokenize(text);
  const termSet = new Set(textTerms);
  const uniqueQueryTerms = Array.from(new Set(queryTerms));
  const matches = uniqueQueryTerms.filter((term) => termSet.has(term)).length;
  const coverage = matches / uniqueQueryTerms.length;
  const density = Math.min(
    1,
    textTerms.filter((term) => uniqueQueryTerms.includes(term)).length /
      Math.max(1, textTerms.length * 0.08),
  );

  return coverage * 0.8 + density * 0.2;
}

export function retrieveTemporaryDocumentChunks(
  query: string,
  document: TemporaryDocument,
  topK = AI_CONFIG.temporaryDocumentTopK,
): RetrievedChunk[] {
  const chunks = chunkDocument(
    {
      id: "temporary-document",
      text: document.text,
      metadata: {
        fileName: document.fileName,
        mimeType: document.mimeType,
        sourceType: "uploaded-document",
        title: document.fileName,
      },
    },
    {
      chunkSize: AI_CONFIG.temporaryDocumentChunkSize,
      overlap: AI_CONFIG.temporaryDocumentChunkOverlap,
    },
  );
  const queryTerms = tokenize(query);
  const ranked = chunks
    .map((chunk) => ({ ...chunk, score: lexicalScore(chunk.text, queryTerms) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);

  if (ranked.some((chunk) => chunk.score > 0)) return ranked;

  // Generic comparison prompts still need a small, bounded document sample.
  return ranked.slice(0, Math.min(2, topK)).map((chunk) => ({
    ...chunk,
    score: 0.01,
  }));
}
