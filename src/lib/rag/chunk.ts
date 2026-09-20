export type RagMetadata = Record<string, string>;

export interface RagDocument {
  id: string;
  text: string;
  metadata: RagMetadata;
}
export interface RagChunk extends RagDocument {
  metadata: RagMetadata & {
    documentId: string;
    chunkIndex: string;
  };
}

export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}

export function chunkDocument(
  document: RagDocument,
  options: ChunkOptions,
): RagChunk[] {
  const { chunkSize, overlap } = options;

  if (chunkSize <= 0) throw new Error("chunkSize must be greater than zero.");
  if (overlap < 0) throw new Error("overlap cannot be negative.");
  if (overlap >= chunkSize) {
    throw new Error("overlap must be smaller than chunkSize.");
  }

  const text = document.text.trim();
  if (!text) return [];

  const chunks: RagChunk[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const candidate = text.slice(start, end);
      const sentenceEnd = Math.max(
        candidate.lastIndexOf("."),
        candidate.lastIndexOf("?"),
        candidate.lastIndexOf("!"),
        candidate.lastIndexOf("\n"),
      );

      if (sentenceEnd >= chunkSize * 0.5) end = start + sentenceEnd + 1;
    }

    const chunkIndex = chunks.length;
    const chunkText = text.slice(start, end).trim();

    if (chunkText) {
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        text: chunkText,
        metadata: {
          ...document.metadata,
          documentId: document.id,
          chunkIndex: String(chunkIndex),
        },
      });
    }

    if (end >= text.length) break;
    start = end - overlap;
  }

  return chunks;
}
