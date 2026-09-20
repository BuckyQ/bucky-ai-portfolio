import type { RagChunk } from "./chunk";

export const PROFILE_INDEX_VERSION = 1 as const;

export interface IndexedRagChunk extends RagChunk {
  embedding: number[];
}

export interface ProfileIndex {
  version: typeof PROFILE_INDEX_VERSION;
  embeddingModel: string;
  generatedAt: string;
  sourceHash: string;
  chunking: {
    size: number;
    overlap: number;
  };
  sources: string[];
  chunks: IndexedRagChunk[];
}
