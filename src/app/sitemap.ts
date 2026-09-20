import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://buckyqian.com/",
      lastModified: "2026-09-20",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://buckyqian.com/projects/ai-job-intelligence",
      lastModified: "2026-09-20",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://buckyqian.com/projects/mini-rag",
      lastModified: "2026-09-20",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://buckyqian.com/privacy",
      lastModified: "2026-09-20",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
