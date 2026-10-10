import { writeFile } from "node:fs/promises";
import { runJobAgent } from "../src/lib/job-agent";

const input = {
  company: "Topify AI — https://topify.ai/",
  job: "DEMONSTRATION BRIEF — not an advertised vacancy. AI Product Engineer: build React and TypeScript product interfaces for AI search visibility, realtime progress, competitor insights, and evidence-backed recommendations. Explain accessibility and performance decisions and how you would evaluate retrieval and generated answers.",
  resume: "Bucky Qian: 4+ years of production software experience. Apple, Frontend Engineer, 2021–2025: accessibility, performance, platform modernization. Topify AI, Frontend Engineer, 2025–2026: realtime AI analysis, prompt tracking, competitor intelligence, reporting, onboarding, conversion. Strongest skills: TypeScript, React and Next.js, AI product UX, RAG, AI agents. This is selected public evidence, not a complete resume.",
};
async function main() {
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required to record a real run.");
const result = await runJobAgent(input, process.env.OPENAI_API_KEY, event => console.log(`${event.stage}: ${event.status}`), AbortSignal.timeout(180000));
await writeFile("public/projects/ai-job-intelligence/recorded-run.json", JSON.stringify(result, null, 2) + "\n");
console.log("Recorded run saved; no credentials included.");

}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
