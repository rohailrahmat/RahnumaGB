import type { MetadataRoute } from "next";
import { destinations } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const publicRoutes = ["/", "/destinations", "/guides", "/planner", "/travel-desk"];

  return [
    ...publicRoutes.map((route) => ({
      url: new URL(route, siteUrl).toString(),
      changeFrequency: "monthly" as const,
    })),
    ...destinations.map((destination) => ({
      url: new URL(`/destinations/${destination.id}`, siteUrl).toString(),
      changeFrequency: "monthly" as const,
    })),
  ];
}
