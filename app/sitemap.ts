import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Computed per-request rather than baked into the build: a sitemap querying
// the DB at build time means a slow/unreachable database can fail the whole
// deployment (this happened — see the build log for the mismatched-env-var
// Vercel project). Also never let a DB hiccup at request time 500 the route;
// degrade to the static routes instead.
export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/about",
  "/how-it-works",
  "/pricing",
  "/contact",
  "/properties",
  "/privacy",
  "/terms",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No lastModified here: these are static marketing pages with no tracked
  // change date, and claiming "now" on every crawl is a false freshness
  // signal that can waste crawl budget.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const properties = await prisma.property
    .findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
    })
    .catch((error) => {
      console.error("[sitemap] Failed to load properties, falling back to static routes:", error);
      return [];
    });

  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${SITE_URL}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...propertyEntries];
}
