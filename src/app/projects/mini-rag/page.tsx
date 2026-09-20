import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import AskBucky from "@/components/AskBucky";

const pageUrl = "https://buckyqian.com/projects/mini-rag";
const pageTitle = "RAG + Evaluation System | Bucky Qian";
const pageDescription =
  "A TypeScript retrieval-augmented generation system with chunking, cosine retrieval, grounded generation, and evaluation.";

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
        alt: "Bucky Qian RAG and Evaluation System case study.",
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

const pipeline = [
  "Documents",
  "Chunk",
  "Embed",
  "Vector store",
  "Retrieve",
  "Generate",
  "Evaluate",
];

const engineeringDetails = [
  ["Chunking", "Configurable chunk size, overlap, sentence boundaries, and metadata."],
  ["Retrieval", "One query embedding, cosine similarity, Top-K ranking, and a relevance threshold."],
  ["Grounding", "Only selected profile evidence is assembled into the generation context."],
  ["Evaluation", "Precision@K and Recall@K for retrieval; Faithfulness and Answer Relevance for generation."],
];

export default function MiniRagPage() {
  return (
    <main className="mini-rag-page">
      <nav className="mini-rag-nav" aria-label="MiniRAG navigation">
        <Link href="/">Bucky Qian</Link>
        <span>RAG system / 02.3</span>
        <Link href="/#work">Selected work</Link>
      </nav>

      <header className="mini-rag-intro">
        <p className="section-label">Case study / RAG + Evaluation</p>
        <h1>
          Retrieval that can explain
          <br />
          <em>where it failed.</em>
        </h1>
        <p>
          I built a TypeScript retrieval-augmented generation system that separates
          retrieval quality from answer quality, then exposes the same pipeline through
          the Ask Bucky portfolio assistant.
        </p>
        <div className="case-intro-actions">
          <a href="#live-demo">Try live demo <ArrowDown aria-hidden="true" /></a>
          <Link href="/#work">Selected work <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </header>

      <div className="mini-rag-pipeline" aria-label="MiniRAG pipeline">
        {pipeline.map((stage, index) => (
          <div key={stage}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </div>

      <section className="case-study-section" aria-labelledby="rag-engineering-title">
        <p className="section-label">Engineering / 01</p>
        <div className="case-study-section-content">
          <h2 id="rag-engineering-title">What I built.</h2>
          <dl className="case-detail-list">
            {engineeringDetails.map(([label, value], index) => (
              <div key={label}>
                <dt><span>{String(index + 1).padStart(2, "0")}</span>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="case-study-section" aria-labelledby="rag-quality-title">
        <p className="section-label">Evaluation / 02</p>
        <div className="case-study-section-content">
          <h2 id="rag-quality-title">Diagnose the layer, not just the answer.</h2>
          <div className="case-quality-grid">
            <div>
              <h3>Retrieval Quality</h3>
              <p><strong>Precision@K</strong> reveals noisy evidence. <strong>Recall@K</strong> reveals relevant evidence the retriever missed.</p>
            </div>
            <div>
              <h3>Answer Quality</h3>
              <p><strong>Faithfulness</strong> catches unsupported claims. <strong>Answer Relevance</strong> checks whether the response addresses the question directly.</p>
            </div>
          </div>
          <ol className="case-decision-flow" aria-label="RAG failure diagnosis">
            <li>Bad answer</li>
            <li>Check retrieval</li>
            <li>Measure Precision / Recall</li>
            <li>Fix retrieval or inspect Faithfulness / Relevance</li>
            <li>Fix generation</li>
          </ol>
        </div>
      </section>

      <section className="case-demo" id="live-demo" aria-labelledby="case-demo-title">
        <div className="case-demo-heading">
          <p className="section-label">Live system / 03</p>
          <h2 id="case-demo-title">Try the retrieval loop.</h2>
          <p>Ask about Bucky&apos;s experience, projects, skills, or education. Successful answers show the profile sources used.</p>
        </div>
        <AskBucky />
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
