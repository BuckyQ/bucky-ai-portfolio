import "server-only";

import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  client ??= new OpenAI({ apiKey });
  return client;
}

export async function createEmbeddings(
  texts: string[],
  model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await getOpenAIClient().embeddings.create({
    model,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
