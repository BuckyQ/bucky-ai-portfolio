import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

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
  ["Planner-led orchestration", "A central planner decomposes the request and coordinates specialist stages."],
  ["Specialist boundaries", "Company research, job analysis, resume evidence, and strategy remain explicit responsibilities."],
  ["Structured outputs", "Stage outputs use predictable contracts so downstream agents receive reviewable inputs."],
  ["Tools + evidence", "Tool-connected research is evaluated before it contributes to the final strategy."],
  ["Tracing", "The workflow exposes the path from request through evidence to final interview plan."],
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
          I designed a planner-led multi-agent workflow that coordinates company
          research, job analysis, resume evidence, and interview strategy while
          keeping every major handoff inspectable.
        </p>
        <div className="case-intro-actions">
          <a href="#architecture">View architecture <ArrowDown aria-hidden="true" /></a>
          <Link href="/#contact">Contact Bucky <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </header>

      <section className="case-study-section" id="architecture" aria-labelledby="agent-architecture-title">
        <p className="section-label">Architecture / 01</p>
        <div className="case-study-section-content">
          <h2 id="agent-architecture-title">A planner with explicit specialist stages.</h2>
          <ol className="case-agent-flow">
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
        <span>Bucky Qian / Applied AI Engineer</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/">Return to portfolio</Link>
        </div>
      </div>
    </main>
  );
}
