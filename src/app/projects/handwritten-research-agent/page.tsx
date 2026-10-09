import type { Metadata } from "next";
import Link from "next/link";
import ResearchAgentGraph from "@/components/ResearchAgentGraph";
import { ArrowUpRight } from "lucide-react";

const title = "Handwritten Research Agent | Bucky Qian";
const description = "A small TypeScript research agent with an explicit control loop, structured decisions, web search, analysis, and replanning.";
const url = "https://buckyqian.com/projects/handwritten-research-agent";
export const metadata: Metadata = {
  title, description, alternates: { canonical: url },
  openGraph: { type: "website", title, description, url, siteName: "Bucky Qian", images: ["/hero-signal-poster.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/hero-signal-poster.jpg"] },
};

export default function HandwrittenResearchAgentPage() {
  return (
    <main id="main-content" className="mini-rag-page project-case-page">
      <a className="skip-link" href="#agent-summary">Skip to project content</a>
      <nav className="mini-rag-nav" aria-label="Research agent navigation">
        <Link href="/">Bucky Qian</Link><span>Research agent</span><Link href="/#work">Selected work</Link>
      </nav>
      <header id="agent-summary" className="mini-rag-intro project-case-intro">
        <p className="section-label">Learning project / TypeScript</p>
        <h1>A small agent.<br /><em>An explicit control loop.</em></h1>
        <p>I built a handwritten research agent to understand how decisions, tools, state, and replanning work together. TypeScript controls the loop; the OpenAI client handles model calls and web search; Zod defines structured output contracts.</p>
        <div className="case-intro-actions">
          <a href="/projects/handwritten-research-agent/handwritten-research-agent.zip" download>Download source <ArrowUpRight aria-hidden="true" /></a>
          <a href="/projects/handwritten-research-agent/README.md">Read the README <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </header>
      <section className="case-study-section" aria-labelledby="research-loop-title">
        <p className="section-label">Control loop / 01</p>
        <div className="case-study-section-content">
          <h2 id="research-loop-title">Decide. Execute. Update. Repeat.</h2>
          <ResearchAgentGraph />
        </div>
      </section>
      <section className="case-study-section" aria-labelledby="research-decisions-title">
        <p className="section-label">Implementation / 02</p>
        <div className="case-study-section-content">
          <h2 id="research-decisions-title">Small enough to inspect.</h2>
          <dl className="case-detail-list">
            <div><dt>Shared contracts</dt><dd>Zod schemas define decisions and plan steps. TypeScript types are inferred from those schemas to avoid duplicate definitions.</dd></div>
            <div><dt>Missing information</dt><dd>The sample query asks about SDK features, pricing, and limitations. The initial plan covers features only, giving the decision layer a reason to search more or replan.</dd></div>
            <div><dt>Bounded loop</dt><dd>The agent runs up to five decision rounds, then generates a best-effort answer if needed. This limits rounds, rather than total API calls or elapsed time.</dd></div>
            <div><dt>Step failures</dt><dd>A failed planned step is recorded in state and the step pointer advances. Other action failures can still terminate execution.</dd></div>
          </dl>
        </div>
      </section>
      <section className="case-study-close" aria-labelledby="research-boundaries-title">
        <p className="section-label">Scope / 03</p>
        <h2 id="research-boundaries-title">A learning project with visible boundaries.</h2>
        <p>This is a command-line prototype. Calculation is a placeholder; state is in memory; there is no formal evaluation suite or application-level retry policy. Model confidence is a routing heuristic, and fallback answers can be incomplete. The downloadable source includes setup instructions and a blank environment template.</p>
        <div className="project-actions"><Link className="project-action" href="/projects/ai-job-intelligence">AI Job Intelligence case study <ArrowUpRight aria-hidden="true" /></Link><Link className="project-action" href="/#contact">Contact Bucky <ArrowUpRight aria-hidden="true" /></Link></div>
      </section>
      <footer className="mini-rag-footer"><span>Bucky Qian / Applied AI Engineer</span><Link href="/">Return to portfolio</Link></footer>
    </main>
  );
}
