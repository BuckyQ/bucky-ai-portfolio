import type { Metadata } from "next";
import Link from "next/link";
import ProjectCards from "@/components/ProjectCards";
export const metadata: Metadata = { title: "Projects | Bucky Qian — AI Product Engineer", description: "AI products that turn research, retrieval, and evidence into useful decisions.", alternates: { canonical: "https://buckyqian.com/projects" }, openGraph: { title: "Projects | Bucky Qian", description: "AI products that turn research, retrieval, and evidence into useful decisions.", url: "https://buckyqian.com/projects", type: "website" } };
export default function ProjectsPage() {
  return <main className="mini-rag-page projects-index"><nav className="mini-rag-nav" aria-label="Projects navigation"><Link href="/">Bucky Qian</Link><Link href="/about">About</Link><Link href="/#contact">Contact</Link></nav><header className="mini-rag-intro"><p className="section-label">AI Product Engineer / Selected projects</p><h1>Problems worth<br /><em>building for.</em></h1><p>Explore the live chatbot, the deeper agent workflow, and product work.</p></header><ProjectCards /><footer className="mini-rag-footer"><span>Bucky Qian / AI Product Engineer</span><Link href="/">Home</Link></footer></main>;
}
