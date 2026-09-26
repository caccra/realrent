import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://realrent-lime.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/landlord", "/tenant", "/caretaker", "/api", "/account", "/onboarding"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
