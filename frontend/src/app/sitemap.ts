import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { propertyPath } from "@/lib/slug";
import { serverFetch } from "@/lib/serverApi";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: "hourly", priority: 0.9 },
  ];

  try {
    const { data } = await serverFetch<{ data: { id: number; title: string; updatedAt: string; }[]; }>(
      "/api/properties/sitemap?limit=5000", { revalidate: 3600 },
    );
    return [
      ...staticPages,
      ...data.map((item) => ({
        url: `${SITE_URL}${propertyPath(item.id, item.title)}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
