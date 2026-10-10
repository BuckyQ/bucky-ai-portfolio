import { readFile, writeFile } from "node:fs/promises";
import type { JobRun } from "../src/lib/job-agent";
async function main() {
  const run = JSON.parse(await readFile("public/projects/ai-job-intelligence/recorded-run.json", "utf8")) as JobRun;
  const output = (stage: string) => run.events.find(event => event.stage === stage && event.status === "complete")?.output || "";
  const company = output("Company Research");
  const tests = [
    { check: "Original role + hypothetical-vacancy label", passed: /AI Product Engineer/i.test(run.answer) && /Hypothetical Vacancy/i.test(run.answer) },
    { check: "Explicit requirements separated from hypotheses", passed: /Hypotheses/i.test(output("Job Analyzer")) && /original job description/i.test(output("Job Analyzer")) },
    { check: "Official company source URLs present", passed: /https:\/\/topify\.ai\//i.test(company) },
    { check: "GEO product reference covered", passed: /Generative Engine Optimization|\bGEO\b/i.test(company) },
    { check: "Tracked-engine reference covered", passed: ["ChatGPT", "Gemini", "Perplexity", "Google"].every(name => company.includes(name)) },
    { check: "Job technology not asserted as company stack", passed: !/React|TypeScript|Next\.js/i.test(company) },
    { check: "Unverified headquarters claim excluded", passed: !/Silicon Valley/i.test(company) },
    { check: "Resume evidence gaps are surfaced", passed: /gap|not explicitly|not directly|no explicit/i.test(output("Resume Analyzer")) },
  ];
  const report = { recordedAt: run.recordedAt, method: "Deterministic presence and boundary checks on one recorded run. These are not factual accuracy, faithfulness, or human-reviewed scores.", references: [{ url: "https://topify.ai/", checkedOn: "2026-10-10", facts: ["Topify describes a GEO platform for AI search visibility.", "Its homepage lists ChatGPT, Gemini, Perplexity, and Google AI Overview."] }], tests, passed: tests.filter(test => test.passed).length, total: tests.length, knownLimitations: ["Role and evidence boundaries can still drift across model stages.", "A claim with a source URL is not automatically supported by that source.", "This single demonstration is not a representative benchmark or a blind human evaluation."] };
  await writeFile("public/projects/ai-job-intelligence/evaluation.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ passed: report.passed, total: report.total, tests }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
