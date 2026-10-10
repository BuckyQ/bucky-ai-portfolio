import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/projects";

export default function ProjectCards({ selectedOnly = false }: { selectedOnly?: boolean }) {
  return <div className="project-card-grid">{(selectedOnly ? projects.slice(0, 3) : projects).map((project, index) =>
    <Link className={`project-card${project.image ? " has-image" : ""}`} href={`/projects/${project.slug}`} key={project.slug}>
      <div className="project-card-visual" aria-hidden="true">
        {project.image ? <Image src={project.image} alt="" fill sizes="(max-width:900px) 100vw, 33vw" /> : <span>{project.slug === "mini-rag" ? "Ask → Retrieve → Answer" : project.slug === "ai-job-intelligence" ? "Research → Evidence → Plan" : "Search → Analyze → Refine"}</span>}
      </div>
      <span className="project-card-label">0{index + 1} / {project.label}</span>
      <h3>{project.title} <ArrowUpRight aria-hidden="true" /></h3>
      <p>{project.problem}</p>
    </Link>
  )}</div>;
}
