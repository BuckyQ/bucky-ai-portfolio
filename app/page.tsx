"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Download, Menu, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import ElectronicOcean from "./components/ElectronicOcean";

const signalBars = [31, 44, 38, 62, 48, 72, 54, 81, 67, 92, 58, 76, 45, 69, 52, 86, 63, 96, 74, 88, 66, 78, 59, 70];

const experience = [
  {
    period: "2025 — 2026",
    company: "Topify AI",
    role: "Frontend Engineer · AI SaaS",
    focus: "AI analysis · Realtime UX · Prompt Intelligence · Analytics · Growth",
  },
  {
    period: "2021 — 2025",
    company: "Apple",
    role: "Frontend Engineer · Core Services",
    focus: "Accessibility · Performance · Platform modernization",
  },
];

const projectFocus = [
  "Realtime AI UI",
  "Prompt Intelligence",
  "Competitor Analysis",
  "Agent Actions",
  "Analytics",
  "Growth",
];

const ragStages = [
  "Documents",
  "Chunk",
  "Embed",
  "Vector store",
  "Retrieve",
  "Generate",
  "Evaluate",
];

const ragEvaluation = ["Precision@K", "Recall@K", "Faithfulness", "Answer Relevance"];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    name: "Bucky Qian",
    jobTitle: "Applied AI Engineer",
    email: "mailto:BuckQianWorking@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mountain View",
      addressRegion: "CA",
      addressCountry: "US",
    },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Trine University" },
      { "@type": "CollegeOrUniversity", name: "University of California, Santa Cruz" },
    ],
    sameAs: [
      "https://github.com/BuckyQ",
      "https://www.linkedin.com/in/hao-q-156421170/",
    ],
    knowsAbout: [
      "Applied AI Engineering",
      "AI Agents",
      "Retrieval-Augmented Generation",
      "Large Language Model Applications",
      "TypeScript",
      "React",
    ],
  },
};

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ProjectReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ProductViewport({
  src,
  alt,
  width,
  height,
  label,
  caption,
  index,
  overview = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  caption: string;
  index: string;
  overview?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [hasScanned, setHasScanned] = useState(false);

  return (
    <motion.figure
      className={`product-viewport${overview ? " product-viewport-overview" : ""}${hasScanned ? " product-viewport-scanned" : ""}`}
      onMouseEnter={() => {
        if (!prefersReducedMotion && !hasScanned) setHasScanned(true);
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.68, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-viewport-head">
        <span>{label}</span>
        <span>Topify AI</span>
        <span className="product-live"><i /> Live</span>
      </div>
      <div className="product-viewport-image">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 767px) 640px, (max-width: 900px) calc(100vw - 44px), 65vw"
        />
      </div>
      <figcaption className="product-viewport-caption">
        <span>{caption}</span>
        <span>{index} / 02</span>
      </figcaption>
    </motion.figure>
  );
}

function AmbientSweep({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`ambient-sweep ${className}`}
      aria-hidden="true"
      initial={prefersReducedMotion ? false : { left: "-24%", opacity: 0 }}
      whileInView={prefersReducedMotion ? undefined : { left: "104%", opacity: [0, 0.22, 0] }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function AgentAmbient() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="agent-ambient" aria-hidden="true">
      {["line-a", "line-b", "line-c"].map((line, index) => (
        <motion.i
          className={`agent-ambient-line ${line}`}
          key={line}
          initial={prefersReducedMotion ? false : { opacity: 0.018 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: [0.018, 0.075, 0.038] }}
          viewport={{ once: true, margin: "-18%" }}
          transition={{ duration: 1.15, delay: 0.18 + index * 0.22, ease: "easeOut" }}
        />
      ))}
      {["node-a", "node-b", "node-c", "node-d"].map((node, index) => (
        <motion.span
          className={`agent-ambient-node ${node}`}
          key={node}
          initial={prefersReducedMotion ? false : { opacity: 0.025, scale: 0.8 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: [0.025, 0.09, 0.045], scale: 1 }}
          viewport={{ once: true, margin: "-18%" }}
          transition={{ duration: 1, delay: 0.28 + index * 0.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function RagAmbient() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="rag-ambient" aria-hidden="true">
      <span className="rag-ambient-marker marker-a">VECTOR / FIELD 03.3</span>
      <span className="rag-ambient-marker marker-b">INDEX / 07</span>
      {["path-a", "path-b", "path-c"].map((path, index) => (
        <i className={`rag-ambient-path ${path}`} key={path}>
          <motion.span
            initial={prefersReducedMotion ? false : { left: "0%", opacity: 0 }}
            whileInView={prefersReducedMotion ? undefined : { left: "100%", opacity: [0, 0.34, 0] }}
            viewport={{ once: true, margin: "-16%" }}
            transition={{ duration: 2.1 + index * 0.28, delay: 0.2 + index * 0.24, ease: "easeInOut" }}
          />
        </i>
      ))}
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.055]);
  const oceanOpacity = useTransform(scrollYProgress, [0, 0.58, 1], [1, 0.88, 0.14]);
  const oceanBrightness = useTransform(scrollYProgress, [0, 0.62, 1], ["brightness(1)", "brightness(.7)", "brightness(.24)"]);
  const heroFade = useTransform(scrollYProgress, [0, 0.58, 1], [1, 0.9, 0]);
  const heroLift = useTransform(scrollYProgress, [0, 0.5, 1], [0, -10, -76]);
  const transitionShade = useTransform(scrollYProgress, [0, 0.55, 1], [0.08, 0.32, 1]);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Bucky Qian home">
          Bucky Qian <span>Applied AI Engineer</span>
        </a>
        <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a>
          <a href="#approach" onClick={() => setMenuOpen(false)}>Approach</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          <a className="mobile-nav-cta" href="mailto:BuckQianWorking@gmail.com" onClick={() => setMenuOpen(false)}>
            Start a conversation <ArrowUpRight size={16} />
          </a>
        </nav>
        <a className="header-contact" href="mailto:BuckQianWorking@gmail.com">
          Start a conversation <ArrowUpRight size={15} />
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          <span>{menuOpen ? "Close" : "Menu"}</span>
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
        <motion.div
          className="hero-media hero-ocean-media"
          style={{
            scale: prefersReducedMotion ? 1 : heroScale,
            opacity: prefersReducedMotion ? 1 : oceanOpacity,
            filter: prefersReducedMotion ? "brightness(.86)" : oceanBrightness,
          }}
        >
          <ElectronicOcean />
        </motion.div>
        <div className="hero-shade" />
        <div className="hero-sea-light" aria-hidden="true" />
        <motion.div
          className="hero-transition-shade"
          style={{ opacity: prefersReducedMotion ? 0.55 : transitionShade }}
          aria-hidden="true"
        />
        <div className="hero-continuity-lines" aria-hidden="true"><i /><i /></div>
        <motion.div
          className="hero-content"
          style={{
            opacity: prefersReducedMotion ? 1 : heroFade,
            y: prefersReducedMotion ? 0 : heroLift,
          }}
        >
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="hero-status"><span /> Mountain View, California · Applied AI Engineer</p>
              <h1 className="hero-title" id="hero-title">Bucky Qian builds<br /><em>AI people can use.</em></h1>
              <p className="hero-summary">Frontend engineer turned Applied AI Engineer, building AI agents, RAG systems, and production LLM applications with product instinct.</p>
            </div>
            <aside className="hero-console" aria-label="Applied AI engineering focus">
              <div className="console-head">
                <span>Intelligence layer</span>
                <span><i /> Signal live</span>
              </div>
              <div className="console-reading">
                <span>Current focus</span>
                <strong>Build. Ship.<br />Evaluate.</strong>
              </div>
              <div className="console-chart" aria-hidden="true">
                {signalBars.map((height, index) => (
                  <i key={`${height}-${index}`} style={{ height: `${height}%`, animationDelay: `${900 + index * 32}ms` }} />
                ))}
              </div>
              <div className="console-stack">
                <span>Agents + RAG</span>
                <span>Realtime UI</span>
                <span>Production</span>
              </div>
            </aside>
          </div>
          <div className="hero-lower">
            <p>AI systems with frontend product instinct.</p>
            <div className="hero-actions">
              <a href="#work">View selected work <ArrowDown size={16} /></a>
              <a href="/Bucky-Qian-Resume.pdf" download>Download resume <Download size={15} /></a>
            </div>
          </div>
        </motion.div>
        <div id="mini-rag-root" data-integration="mini-rag-reserved" aria-hidden="true" />
      </section>

      <section className="profile" id="about" aria-labelledby="profile-title">
        <div className="profile-continuity" aria-hidden="true"><i /><i /></div>
        <div className="profile-atmosphere" aria-hidden="true">
          <div className="profile-ocean-residue" />
          <div className="profile-guides" />
          <div className="profile-grain" />
          <span className="profile-marker profile-marker-a">SYS / 01-A</span>
          <span className="profile-marker profile-marker-b">GRID / X-072</span>
          <span className="profile-marker profile-marker-c">LAYER DEPTH / 01</span>
        </div>
        <div className="profile-portrait">
          <div className="profile-photo-wrap">
            <Image
              className="profile-photo"
              src="/pdf/01_head.jpeg"
              alt="Portrait of Bucky Qian"
              fill
              sizes="(max-width: 900px) 100vw, 36vw"
            />
          </div>
          <div className="portrait-status" aria-hidden="true"><span /> Portrait node / 01</div>
          <div className="portrait-copy">Bucky Qian<br />Applied AI Engineer</div>
        </div>
        <div className="profile-story">
          <p className="section-label">01 / Profile</p>
          <Reveal className="profile-heading">
            <h2 id="profile-title">I learned to shape the interface.<br /><em>Now I shape the intelligence behind it.</em></h2>
          </Reveal>
          <Reveal className="profile-summary">
            <p>Applied AI Engineer with 4+ years of production software experience across Apple and Topify AI.</p>
            <p>My frontend background shapes how I build AI products: latency should be visible, uncertainty understandable, and system quality measurable.</p>
          </Reveal>
          <div className="profile-experience" aria-label="Experience timeline">
            {experience.map((item) => (
              <Reveal className="profile-experience-row" key={item.company}>
                <span className="profile-experience-period">{item.period}</span>
                <div className="profile-experience-role">
                  <h3>{item.company}</h3>
                  <p>{item.role}</p>
                </div>
                <p className="profile-experience-focus">{item.focus}</p>
              </Reveal>
            ))}
          </div>
          <div className="profile-system-state" aria-hidden="true">
            <span>Production experience / 2021—2026</span>
            <span><i /> Signal verified</span>
          </div>
        </div>
      </section>

      <section className="selected-work" id="work" aria-labelledby="selected-work-title">
        <div className="selected-work-inner">
          <ProjectReveal className="selected-work-header">
            <p className="section-label">03 / Selected work</p>
            <h2 id="selected-work-title">Selected work.</h2>
            <p>Production AI product work, agent orchestration, and retrieval evaluation.</p>
          </ProjectReveal>

          <article className="work-project topify-project" aria-labelledby="topify-title">
            <AmbientSweep className="topify-ambient-sweep" />
            <ProjectReveal className="work-project-header topify-project-header">
              <div>
                <p className="section-label">03.1 / Topify AI</p>
                <h3 id="topify-title">Topify AI</h3>
                <p className="work-project-kicker">Production AI Search Intelligence</p>
              </div>
              <div className="work-project-summary">
                <p>I owned core product experiences across realtime AI analysis, prompt tracking, competitor intelligence, reporting, onboarding, and conversion.</p>
                <div className="work-project-focus" aria-label="Topify key systems">
                  {projectFocus.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            </ProjectReveal>

            <div className="topify-overview">
              <p className="project-view-label">01 / Product overview</p>
              <ProductViewport
                src="/topify/topify-overview.png"
                alt="Topify AI production overview dashboard showing visibility, sentiment, position, share of voice, competitors, and agent actions"
                width={4000}
                height={2500}
                label="Product system / Overview"
                caption="AI visibility / Competitor intelligence / Production"
                index="01"
                overview
              />
            </div>

            <div className="topify-detail">
              <ProjectReveal className="topify-detail-copy">
                <p className="project-view-label">02 / Realtime + agent detail</p>
                <h4>Making AI latency visible and usable.</h4>
                <p>Progressive states make analysis legible while reviewable agent actions turn signals into a clear next step.</p>
                <div className="topify-detail-meta"><span>SSE / Progressive state</span><span>Human review</span></div>
              </ProjectReveal>
              <div className="topify-detail-media">
                <ProductViewport
                  src="/topify/topify-realtime.png"
                  alt="Topify AI realtime analysis progress and generated optimization action"
                  width={1616}
                  height={1560}
                  label="Realtime system / Agent detail"
                  caption="Analysis progress / Reviewable action"
                  index="02"
                />
              </div>
            </div>
          </article>

          <article className="work-project agent-project" aria-labelledby="agent-title">
            <AgentAmbient />
            <ProjectReveal className="work-project-header technical-project-header">
              <div>
                <p className="section-label">03.2 / AI Job Intelligence Agent</p>
                <h3 id="agent-title">AI Job Intelligence Agent</h3>
              </div>
              <p>A coordinated agent workflow that connects role research, fit analysis, resume evidence, and interview strategy.</p>
            </ProjectReveal>
            <ProjectReveal className="job-agent-diagram">
              <div className="diagram-chain diagram-chain-top">
                {[
                  ["01", "User"],
                  ["02", "Triage"],
                  ["03", "Planner"],
                ].map(([number, name]) => (
                  <div className="diagram-node" key={name}><span>{number}</span><strong>{name}</strong></div>
                ))}
              </div>
              <div className="diagram-branch">
                <div className="diagram-node"><span>04A</span><strong>Company<br />research</strong></div>
                <div className="diagram-node"><span>04B</span><strong>Job<br />analyzer</strong></div>
              </div>
              <div className="diagram-merge" aria-hidden="true"><i /><i /></div>
              <div className="diagram-chain diagram-chain-bottom">
                {[
                  ["05", "Resume analyzer"],
                  ["06", "Strategy agent"],
                  ["07", "Interview plan"],
                ].map(([number, name]) => (
                  <div className="diagram-node" key={name}><span>{number}</span><strong>{name}</strong></div>
                ))}
              </div>
              <div className="diagram-trace" aria-label="Supporting agent capabilities">
                <span>Tools</span><span>Structured output</span><span>Tracing</span><span>Evaluation</span>
              </div>
            </ProjectReveal>
          </article>

          <article className="work-project rag-project" aria-labelledby="rag-title">
            <RagAmbient />
            <ProjectReveal className="work-project-header technical-project-header">
              <div>
                <p className="section-label">03.3 / RAG + Evaluation System</p>
                <h3 id="rag-title">RAG + Evaluation System</h3>
              </div>
              <p>A retrieval pipeline designed to measure evidence quality before treating an answer as trustworthy.</p>
            </ProjectReveal>
            <div className="rag-project-pipeline" aria-label="Retrieval-Augmented Generation pipeline">
              {ragStages.map((stage, index) => (
                <ProjectReveal className="rag-project-stage" delay={index * 0.04} key={stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage}</strong>
                </ProjectReveal>
              ))}
            </div>
            <ProjectReveal className="rag-evaluation" aria-label="RAG evaluation concepts">
              <span>Evaluation</span>
              {ragEvaluation.map((item) => <strong key={item}>{item}</strong>)}
            </ProjectReveal>
          </article>
        </div>
      </section>

      <section className="background-section" id="approach" aria-labelledby="background-title">
        <div className="background-section-inner">
          <p className="section-label">04 / Background</p>
          <Reveal className="background-heading">
            <h2 id="background-title">Frontend instincts.<br /><em>Applied AI systems.</em></h2>
          </Reveal>
          <Reveal className="background-copy">
            <p>Years of product engineering taught me that model capability is only useful when users can understand what the system is doing, trust the result, and act on it.</p>
            <p>That is the perspective I bring to Applied AI.</p>
          </Reveal>
        </div>
      </section>

      <footer id="contact">
        <div className="contact-ambient" aria-hidden="true"><i /><i /><i /></div>
        <div className="contact-main">
          <p className="section-label">05 / Contact</p>
          <h2>Let&apos;s build<br />something useful.</h2>
          <nav className="contact-links" aria-label="Contact links">
            <a href="mailto:BuckQianWorking@gmail.com">Email</a>
            <a href="https://github.com/BuckyQ" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/hao-q-156421170/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="/Bucky-Qian-Resume.pdf" download>Resume</a>
          </nav>
          <a className="contact-email" href="mailto:BuckQianWorking@gmail.com">
            Start a conversation <ArrowUpRight />
          </a>
        </div>
        <div className="footer-meta">
          <p>Bucky Qian · Applied AI Engineer<br />Mountain View, California</p>
          <span>© 2026 Bucky Qian</span>
        </div>
      </footer>
    </main>
  );
}
