import type { Metadata } from "next";
import Link from "next/link";

import AskBucky from "@/components/AskBucky";

export const metadata: Metadata = {
  title: "MiniRAG | Bucky Qian",
  description:
    "An interactive retrieval-augmented profile demo built by Applied AI Engineer Bucky Qian.",
};

const pipeline = ["Markdown", "Chunk", "Embed", "Retrieve", "Generate"];

export default function MiniRagPage() {
  return (
    <main className="mini-rag-page">
      <nav className="mini-rag-nav" aria-label="MiniRAG navigation">
        <Link href="/">Bucky Qian</Link>
        <span>MiniRAG / 01</span>
        <Link href="/#work">Selected work</Link>
      </nav>

      <header className="mini-rag-intro">
        <p className="section-label">Interactive system / MiniRAG</p>
        <h1>
          A small retrieval system for
          <br />
          <em>verified answers.</em>
        </h1>
        <p>
          Ask questions about my experience and projects. Responses are grounded in
          the same profile data used by this portfolio, with retrieved sources shown
          after each answer.
        </p>
      </header>

      <div className="mini-rag-pipeline" aria-label="MiniRAG pipeline">
        {pipeline.map((stage, index) => (
          <div key={stage}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </div>

      <AskBucky />

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
