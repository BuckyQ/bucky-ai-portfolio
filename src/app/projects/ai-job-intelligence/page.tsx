import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import JobAgentDemo from "@/components/JobAgentDemo";
import JobRunReplay from "@/components/JobRunReplay";
import evaluation from "../../../../public/projects/ai-job-intelligence/evaluation.json";
import recordedRun from "../../../../public/projects/ai-job-intelligence/recorded-run.json";
import type { JobRun } from "@/lib/job-agent";

const pageUrl = "https://buckyqian.com/projects/ai-job-intelligence";
const pageTitle = "AI Job Intelligence Agent | Bucky Qian";
const pageDescription =
  "A planner-led multi-agent workflow for company research, job analysis, resume evidence, and interview strategy.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    siteName: "Bucky Qian",
    images: [
      {
        url: "/hero-signal-poster.jpg",
        width: 1280,
        height: 720,
        alt: "Bucky Qian AI Job Intelligence Agent case study.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/hero-signal-poster.jpg"],
  },
};

const architecture = [
  ["01", "User", "Provides the target role and career context."],
  ["02", "Triage", "Identifies the request scope before deeper work begins."],
  ["03", "Planner", "Breaks the task into company and job-analysis tracks."],
  ["04A", "Company Research", "Builds relevant company context."],
  ["04B", "Job Analyzer", "Extracts role requirements and signals."],
  ["05", "Resume Analyzer", "Maps resume evidence to the role."],
  ["06", "Strategy Agent", "Synthesizes research and evidence into a strategy."],
  ["07", "Interview Plan", "Produces a human-reviewable preparation plan."],
];

const implementation = [
  ["Planner-led orchestration", "A planning brief precedes two specialist tracks; fixed typed handoffs combine their outputs."],
  ["Specialist boundaries", "Company research, job analysis, resume evidence, and strategy remain explicit responsibilities."],
  ["Typed handoffs", "Typed stage events carry status, timing, and reviewable text outputs between explicit handoffs."],
  ["Tools + evidence", "Company research uses web search and preserves official source URLs for review; offline checks expose coverage and boundary failures."],
  ["Tracing", "The BYOK workflow shows stage status and reviewable specialist outputs; it does not expose hidden model reasoning."],
  ["Human review", "The system produces inspectable guidance rather than hiding decisions behind one opaque response."],
];

export default function AiJobIntelligencePage() {
  return (
    <main className="mini-rag-page project-case-page">
      <nav className="mini-rag-nav" aria-label="AI Job Intelligence navigation">
        <Link href="/">Bucky Qian</Link>
        <span>Agent system / 02.2</span>
        <Link href="/#work">Selected work</Link>
      </nav>

      <header className="mini-rag-intro project-case-intro">
        <p className="section-label">Case study / AI Job Intelligence Agent</p>
        <h1>
          Research coordinated into
          <br />
          <em>interview strategy.</em>
        </h1>
        <p>
          Preparing for interviews means connecting company context, role requirements, and evidence from a resume. This multi-step workflow brings those inputs together into a reviewable interview plan.
        </p>
        <div className="case-intro-actions">
          <a href="#architecture">View architecture <ArrowDown aria-hidden="true" /></a>
          <Link href="/projects/mini-rag#live-demo">Try the live chatbot <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </header>

      <figure className="demo-video"><video controls playsInline preload="metadata" poster="/projects/ai-job-intelligence/demo-poster.jpg" aria-label="Two-minute screen recording of the real job-agent replay"><source src="/projects/ai-job-intelligence/demo.mp4" type="video/mp4" /><track kind="captions" src="/projects/ai-job-intelligence/demo.vtt" srcLang="en" label="English" default />Your browser cannot play this video. <a href="/projects/ai-job-intelligence/demo.mp4">Download the demo</a>.</video><figcaption>2-minute screen recording of the real-run replay, specialist outputs, architecture, and evaluation. Silent, with English captions. The vacancy is a demonstration brief.</figcaption></figure>
      <JobRunReplay run={recordedRun as JobRun} />
      <JobAgentDemo />

      <section className="case-study-section" id="architecture" aria-labelledby="agent-architecture-title">
        <p className="section-label">Architecture / 01</p>
        <div className="case-study-section-content">
          <h2 id="agent-architecture-title">A planner with explicit specialist stages.</h2>
          <ol className="case-agent-flow job-architecture" aria-label="Eight-stage pipeline: User to Triage to Planner, branching to Company Research and Job Analyzer, then Resume Analyzer, Strategy Agent, and Interview Plan">
            {architecture.map(([index, name, description]) => (
              <li key={index}>
                <span>{index}</span>
                <div>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="case-study-section" aria-labelledby="agent-implementation-title">
        <p className="section-label">Engineering / 02</p>
        <div className="case-study-section-content">
          <h2 id="agent-implementation-title">Implementation details.</h2>
          <dl className="case-detail-list">
            {implementation.map(([label, value], index) => (
              <div key={label}>
                <dt><span>{String(index + 1).padStart(2, "0")}</span>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="case-study-section" id="job-evaluation" aria-labelledby="agent-evaluation-title">
        <p className="section-label">Evaluation / 03</p>
        <div className="case-study-section-content"><h2 id="agent-evaluation-title">Check the evidence behind the plan.</h2>
        <p>A company summary should cover the requested facts, support each claim with a source, and identify missing evidence. Resume mapping should distinguish verified experience from gaps.</p>
        <dl className="case-detail-list"><div><dt>Company facts</dt><dd>Compare claims with a human-written reference built from official company sources; mark supported, unsupported, or missing.</dd></div><div><dt>Role coverage</dt><dd>Check whether the summary and interview plan address each requirement in the supplied job description.</dd></div><div><dt>Resume grounding</dt><dd>Trace each experience claim to supplied resume evidence, without inferring credentials.</dd></div></dl>
        <h3>Recorded-run checks: {evaluation.passed} / {evaluation.total} passed.</h3>
        <p>Deterministic checks against a small reference from <a href="https://topify.ai/">Topify’s official homepage</a>. These check coverage and handoff boundaries; they are not an accuracy benchmark or blind human evaluation.</p>
        <div className="evaluation-table-wrap"><table className="evaluation-table"><thead><tr><th>Check</th><th>Recorded result</th></tr></thead><tbody>{evaluation.tests.map(test => <tr key={test.check}><td>{test.check}</td><td>{test.passed ? "Pass" : "Needs review"}</td></tr>)}</tbody></table></div>
        <p className="evaluation-status">Observed failures: the initial run drifted from the role to a stage name; a second run inferred company technologies from the job brief. The current run separates those inputs, but its Silicon Valley location claim remains unsupported by the checked official reference. Source URLs alone do not establish faithfulness.</p>
        <div className="case-intro-actions"><a href="/projects/ai-job-intelligence/evaluation.json" download>Evaluation report →</a><a href="/projects/ai-job-intelligence/initial-run.json" download>Initial failure trace →</a><a href="/projects/ai-job-intelligence/second-run.json" download>Second failure trace →</a></div>
        </div>
      </section>
      <section className="case-study-section" aria-labelledby="agent-scope-title"><p className="section-label">Scope / limitations</p><div className="case-study-section-content"><h2 id="agent-scope-title">Preparation support, with human review.</h2><p>This is a personal engineering demo with fixed stages, not an autonomous hiring or application system. The recorded vacancy is hypothetical. Web evidence may be incomplete or stale, and model outputs can contain unsupported claims. Review sources and resume mappings before using the plan. Runs have a three-minute deadline and no persistent memory. OpenAI charges apply to BYOK runs.</p></div></section>
      <section className="case-study-close" aria-labelledby="agent-close-title">
        <p className="section-label">Output / 03</p>
        <h2 id="agent-close-title">Evidence in. Reviewable strategy out.</h2>
        <p>The final interview plan remains connected to the research and resume evidence that produced it.</p>
        <div className="project-actions">
          <Link className="project-action" href="/#work">
            Return to selected work <ArrowUpRight aria-hidden="true" />
          </Link>
          <Link className="project-action" href="/#contact">
            Contact Bucky <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mini-rag-footer">
        <span>Bucky Qian / AI Product Engineer</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/">Return to portfolio</Link>
        </div>
      </div>
    </main>
  );
}
