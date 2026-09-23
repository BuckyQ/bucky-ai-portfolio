export type DirectResponseKind =
  | "assistant-introduction"
  | "capabilities"
  | "site-purpose";

export interface DirectResponse {
  answer: string;
  kind: DirectResponseKind;
}

const assistantIdentityPatterns = [
  /^who (?:are|r) (?:you|u)$/,
  /^what are (?:you|u)$/,
  /^who am i (?:speaking|talking) (?:with|to)$/,
  /^are (?:you|u) (?:bucky|an? (?:ai|assistant|bot|chatbot))$/,
  /^is this (?:bucky|an? (?:ai|assistant|bot|chatbot))$/,
];

const capabilityPatterns = [
  /^what can (?:you|u) do$/,
  /^how can (?:you|u) help(?: me)?$/,
  /^what (?:can|should) i ask (?:you|u)$/,
  /^what is this (?:chat|assistant)$/,
];

const greetingPatterns = [/^(?:hi|hello|hey|yo)(?: there)?$/];

const sitePurposePatterns = [
  /^(?:what is|whats) (?:the )?purpose of (?:this|the) (?:website|site|portfolio)$/,
  /^(?:what is|whats) (?:this|the) (?:website|site|portfolio)(?: (?:for|about))?$/,
  /^what does (?:this|the) (?:website|site|portfolio) (?:do|show)$/,
  /^why (?:does|is|was) (?:this|the) (?:website|site|portfolio) (?:exist|built|made)$/,
  /^tell me about (?:this|the) (?:website|site|portfolio)$/,
];

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(question: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(question));
}

export function getDirectResponse(question: string): DirectResponse | null {
  const normalizedQuestion = normalizeQuestion(question);

  if (matchesAny(normalizedQuestion, sitePurposePatterns)) {
    return {
      kind: "site-purpose",
      answer:
        "This is Bucky Qian's interactive portfolio and resume. It helps recruiters, hiring managers, and collaborators understand his move from frontend engineering into Applied AI through production work, AI agent projects, RAG and evaluation systems, and clear ways to review his work or contact him.",
    };
  }

  if (
    matchesAny(normalizedQuestion, assistantIdentityPatterns) ||
    matchesAny(normalizedQuestion, greetingPatterns)
  ) {
    return {
      kind: "assistant-introduction",
      answer:
        "I'm Ask Bucky AI, Bucky Qian's portfolio assistant. I can help you explore his professional experience, projects, technical skills, education, and career background.",
    };
  }

  if (matchesAny(normalizedQuestion, capabilityPatterns)) {
    return {
      kind: "capabilities",
      answer:
        "I can answer questions about Bucky Qian's experience, AI and software projects, technical skills, education, and career background. Try asking what he built at Topify AI, what he worked on at Apple, or how he approaches RAG.",
    };
  }

  return null;
}
