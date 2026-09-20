const identityPatterns = [
  /\bbucky\b/i,
  /\bqian\b/i,
  /\b(?:he|his|him)\b/i,
  /\b(?:you|your)\b/i,
];

const professionalPatterns = [
  /\bexperience\b/i,
  /\bcareer\b/i,
  /\bwork(?:ed|ing)?\b/i,
  /\brole\b/i,
  /\bjob\b/i,
  /\bprojects?\b/i,
  /\bskills?\b/i,
  /\btechnical\b/i,
  /\btechnolog(?:y|ies)\b/i,
  /\bstack\b/i,
  /\beducation\b/i,
  /\bschool\b/i,
  /\buniversity\b/i,
  /\bdegree\b/i,
  /\bcertifications?\b/i,
  /\bawards?\b/i,
  /\bresume\b/i,
  /\bbackground\b/i,
  /\bengineer(?:ing)?\b/i,
  /\b(?:build|built|develop|developed)\b/i,
  /\b(?:company|companies|employer|team|leadership|management)\b/i,
  /\b(?:product|design|architecture)\b/i,
  /\b(?:contact|github|linkedin)\b/i,
  /\b(?:location|based|mountain view)\b/i,
  /\b(?:apple|topify)\b/i,
  /\bai\b/i,
  /\bartificial intelligence\b/i,
  /\bagents?\b/i,
  /\brag\b/i,
  /\bretrieval\b/i,
  /\bllm(?:s)?\b/i,
  /\bfrontend\b/i,
  /\bbackend\b/i,
  /\bapi(?:s)?\b/i,
  /\bdatabases?\b/i,
  /\bcloud\b/i,
  /\b(?:aws|gcp|azure|kubernetes)\b/i,
  /\breact\b/i,
  /\btypescript\b/i,
  /\bjavascript\b/i,
  /\bpython\b/i,
  /\baccessibility\b/i,
  /\bevaluation\b/i,
  /\bembeddings?\b/i,
  /\bvectors?\b/i,
];

const sensitivePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
  /\b(?:\d[ -]*?){13,19}\b/,
  /\b(?:sk|sbp)[-_A-Za-z0-9]{16,}\b/i,
  /\beyJ[A-Za-z0-9_-]{20,}\b/,
  /\b(?:password|passcode|api[-_\s]?key|secret key|bearer token|access token|social security|ssn|credit card)\b/i,
  /\b(?:my name is|contact me at|call me at|my address is)\b/i,
];

const spamPatterns = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b(?:buy followers|casino|crypto giveaway|backlinks?|viagra)\b/i,
  /(.)\1{7,}/,
];

export interface QuestionScopeAnalysis {
  isProfessionalQuestion: boolean;
  isSafeToStore: boolean;
}

function hasExcessiveWordRepetition(question: string): boolean {
  const words = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (words.length < 8) return false;

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

  return Math.max(...counts.values()) / words.length >= 0.6;
}

export function analyzeQuestionScope(
  question: string,
): QuestionScopeAnalysis {
  const professionalSignalCount = professionalPatterns.filter((pattern) =>
    pattern.test(question),
  ).length;
  const hasIdentitySignal = identityPatterns.some((pattern) =>
    pattern.test(question),
  );
  const isProfessionalQuestion =
    professionalSignalCount >= 2 ||
    (hasIdentitySignal && professionalSignalCount >= 1);
  const containsSensitiveData = sensitivePatterns.some((pattern) =>
    pattern.test(question),
  );
  const looksLikeSpam =
    spamPatterns.some((pattern) => pattern.test(question)) ||
    hasExcessiveWordRepetition(question);

  return {
    isProfessionalQuestion,
    isSafeToStore:
      isProfessionalQuestion && !containsSensitiveData && !looksLikeSpam,
  };
}
