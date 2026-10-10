import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
export const metadata: Metadata = { title: "About | Bucky Qian — AI Product Engineer", description: "AI Product Engineer with 4+ years of production software experience across Apple and Topify AI.", alternates: { canonical: "https://buckyqian.com/about" }, openGraph: { title: "About Bucky Qian", description: "Product engineering experience across Apple and Topify AI.", url: "https://buckyqian.com/about", type: "profile" } };
const experience = [
  ["2025 — 2026", "Topify AI", "Frontend Engineer · AI SaaS", "AI analysis · Realtime UX · Prompt intelligence · Analytics · Growth"],
  ["2021 — 2025", "Apple", "Frontend Engineer · Core Services", "Accessibility · Performance · Platform modernization"],
];
export default function AboutPage() {
  return <main className="mini-rag-page about-page"><nav className="mini-rag-nav" aria-label="About navigation"><Link href="/">Bucky Qian</Link><Link href="/projects">Projects</Link><Link href="/#contact">Contact</Link></nav>
    <header className="mini-rag-intro"><p className="section-label">01 / Profile</p><h1>I learned to shape<br /><em>the interface.</em></h1><p>Now I shape the intelligence behind it. AI Product Engineer with 4+ years of production software experience across Apple and Topify AI.</p></header>
    <div className="about-profile"><Image src="/pdf/01_head.jpeg" alt="Portrait of Bucky Qian" width={600} height={760} /><div><p>My frontend background shapes how I build AI products: latency should be visible, uncertainty understandable, and system quality measurable.</p><div className="profile-experience" aria-label="Experience timeline">{experience.map(([period, company, role, focus]) => <div className="about-experience" key={company}><span>{period}</span><h2>{company}</h2><p>{role}</p><p>{focus}</p></div>)}</div></div></div>
    <section className="case-study-section" aria-labelledby="background-title"><p className="section-label">03 / Background</p><div className="case-study-section-content"><h2 id="background-title">Frontend instincts. AI product systems.</h2><h3>Why does frontend experience matter for AI products?</h3><p>Frontend engineering taught me to design around latency, uncertainty, model state, accessibility, and user trust.</p></div></section>
    <footer className="mini-rag-footer"><span>Bucky Qian / AI Product Engineer</span><Link href="/projects">Explore projects</Link></footer></main>;
}
