import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["about", "projects", "projects/topify"].map(path => ({ url: `https://buckyqian.com/${path}`, lastModified: "2026-10-10", changeFrequency: "monthly" as const, priority: 0.7 })),
    {
      url: "https://buckyqian.com/projects/handwritten-research-agent",
      lastModified: "2026-10-09",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://buckyqian.com/",
      lastModified: "2026-10-10",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://buckyqian.com/projects/ai-job-intelligence",
      lastModified: "2026-10-10",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://buckyqian.com/projects/mini-rag",
      lastModified: "2026-10-10",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://buckyqian.com/privacy",
      lastModified: "2026-10-10",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
