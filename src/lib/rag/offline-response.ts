export type OfflineResponseKind =
  | "apple"
  | "education"
  | "overview"
  | "projects"
  | "rag"
  | "topify";

export interface OfflineProfileResponse {
  answer: string;
  kind: OfflineResponseKind;
}

interface OfflineResponseDefinition extends OfflineProfileResponse {
  patterns: RegExp[];
}

const responses: OfflineResponseDefinition[] = [
  {
    kind: "overview",
    patterns: [
      /^who is bucky$/,
      /^tell me about bucky$/,
      /^give me an overview of bucky$/,
    ],
    answer:
      "Bucky Qian is an Applied AI Engineer with more than four years of production software experience across Apple and Topify AI. He combines frontend product engineering with hands-on work in AI agents, retrieval-augmented generation, evaluation, and production LLM interfaces.",
  },
  {
    kind: "topify",
    patterns: [
      /^what did bucky (?:build|do|work on) at topify(?: ai)?$/,
      /^tell me about buckys work at topify(?: ai)?$/,
    ],
    answer:
      "At Topify AI, Bucky built customer-facing AI visibility workflows, prompt and citation tracking, competitor analysis, AI-generated reporting, and realtime analysis interfaces using Server-Sent Events. He also worked on onboarding, analytics, conversion funnels, billing, accessibility, performance, SEO, and internal prompt-management tools.",
  },
  {
    kind: "apple",
    patterns: [
      /^what did bucky (?:build|do|work on) at apple$/,
      /^tell me about buckys work at apple$/,
    ],
    answer:
      "At Apple, Bucky worked as a Frontend Engineer on internal web platforms supporting global operations. His work covered frontend architecture, accessibility, performance, framework modernization, AI-powered chat and recommendation experiences, Vue 2 to Vue 3 migration, Webpack to Vite migration, and reusable WCAG 2.1 AA standards.",
  },
  {
    kind: "projects",
    patterns: [
      /^what ai projects has bucky built$/,
      /^what are buckys ai projects$/,
      /^tell me about buckys ai projects$/,
    ],
    answer:
      "Bucky's Applied AI work includes Topify AI's production LLM interfaces, a TypeScript Mini RAG system with retrieval and answer evaluation, and a planner-led multi-agent research workflow using tool calling, structured outputs, tracing, evidence evaluation, and human-reviewable results.",
  },
  {
    kind: "rag",
    patterns: [
      /^what (?:experience does bucky have|is buckys experience) with rag$/,
      /^how does bucky evaluate rag$/,
      /^tell me about buckys rag experience$/,
    ],
    answer:
      "Bucky built a production-style RAG system in TypeScript with document chunking, embeddings, vector similarity, Top-K retrieval, similarity thresholds, metadata filtering, context construction, and grounded generation. He evaluates retrieval with Precision@K and Recall@K, then evaluates generation with faithfulness and answer relevance.",
  },
  {
    kind: "education",
    patterns: [
      /^what is buckys education$/,
      /^where did bucky go to school$/,
      /^what degrees does bucky have$/,
    ],
    answer:
      "Bucky holds a Master of Information Studies in Technology from Trine University, a Bachelor of Computer Science from the University of California, Santa Cruz, and an Associate Degree in Mathematics and Computer Science from the College of San Mateo.",
  },
];

function normalizeQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getOfflineProfileResponse(
  question: string,
): OfflineProfileResponse | null {
  const normalizedQuestion = normalizeQuestion(question);
  const match = responses.find((response) =>
    response.patterns.some((pattern) => pattern.test(normalizedQuestion)),
  );

  return match ? { answer: match.answer, kind: match.kind } : null;
}
