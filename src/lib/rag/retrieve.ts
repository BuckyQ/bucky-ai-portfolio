import "server-only";

import { AI_CONFIG } from "@/config/ai";
import profileIndexData from "@/data/profile/bucky-profile-index.json";

import type { RagChunk } from "./chunk";
import { createEmbeddings } from "./embedding";
import type { ProfileIndex } from "./index-schema";
import { cosineSimilarity } from "./similarity";

export interface RetrievedChunk extends RagChunk {
  score: number;
}

const profileIndex = profileIndexData as ProfileIndex;

export async function retrieveChunks(
  query: string,
  options: { topK?: number; minSimilarity?: number } = {},
): Promise<RetrievedChunk[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const [queryEmbedding] = await createEmbeddings(
    [normalizedQuery],
    profileIndex.embeddingModel,
  );
  if (!queryEmbedding) throw new Error("Failed to create a query embedding.");

  const topK = options.topK ?? AI_CONFIG.retrievalTopK;
  const minSimilarity = options.minSimilarity;

  return profileIndex.chunks
    .map(({ embedding, ...chunk }) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, embedding),
    }))
    .filter(
      (chunk) =>
        minSimilarity === undefined || chunk.score >= minSimilarity,
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}
