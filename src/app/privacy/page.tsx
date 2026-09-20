import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Bucky Qian",
  description:
    "How the Ask Bucky AI portfolio demo processes and stores unanswered questions.",
  alternates: {
    canonical: "https://buckyqian.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mini-rag-page privacy-page">
      <nav className="mini-rag-nav" aria-label="Privacy navigation">
        <Link href="/">Bucky Qian</Link>
        <span>System / Privacy</span>
        <Link href="/projects/mini-rag">Ask Bucky AI</Link>
      </nav>

      <header className="privacy-intro">
        <p className="section-label">Data note / Ask Bucky AI</p>
        <h1>Privacy, kept <em>plain.</em></h1>
        <p>
          Ask Bucky is a portfolio demo. It uses submitted questions to retrieve
          public professional information and generate grounded answers.
        </p>
      </header>

      <div className="privacy-content">
        <section aria-labelledby="privacy-collected">
          <p>01 / Collection</p>
          <div>
            <h2 id="privacy-collected">What may be saved</h2>
            <p>
              When the assistant cannot answer a valid professional question,
              it may save the question text, a failure category, the highest
              retrieval score, review status, and creation time in Supabase.
            </p>
          </div>
        </section>

        <section aria-labelledby="privacy-not-collected">
          <p>02 / Boundaries</p>
          <div>
            <h2 id="privacy-not-collected">What is not saved</h2>
            <p>
              The feedback record does not include raw IP addresses, user
              identity, successful questions, chat history, uploaded files, or
              voice data. Inputs that appear to contain contact details,
              credentials, or obvious spam are excluded from feedback logging.
            </p>
          </div>
        </section>

        <section aria-labelledby="privacy-purpose">
          <p>03 / Purpose</p>
          <div>
            <h2 id="privacy-purpose">Human review only</h2>
            <p>
              Saved questions are reviewed to identify gaps in Bucky&apos;s public
              profile. They are never added automatically to the knowledge base
              and may be retained until reviewed or deleted.
            </p>
          </div>
        </section>

        <section aria-labelledby="privacy-contact">
          <p>04 / Contact</p>
          <div>
            <h2 id="privacy-contact">Questions or removal requests</h2>
            <p>
              Contact <a href="mailto:BuckQianWorking@gmail.com">BuckQianWorking@gmail.com</a>.
            </p>
          </div>
        </section>
      </div>

      <footer className="mini-rag-footer">
        <time dateTime="2026-09-20">Last updated / Sep 20, 2026</time>
        <div>
          <Link href="/projects/mini-rag">Ask Bucky AI</Link>
          <Link href="/">Return to portfolio</Link>
        </div>
      </footer>
    </main>
  );
}
