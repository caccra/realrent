// The canonical public domain. Deliberately independent of NEXTAUTH_URL
// (used for auth callback/payment-redirect URLs) — Vercel redirects the
// apex to www, so www is what actually gets indexed, and SEO surfaces
// (sitemap, robots, canonical tags, OG) need to agree with that regardless
// of how NEXTAUTH_URL is configured for auth.
export const SITE_URL = "https://www.kezavi.com";
export const SITE_NAME = "Kezavi";
export const SITE_DESCRIPTION =
  "Kezavi is a property management platform for Uganda landlords, tenants, property managers, and caretakers — digital leases, rent tracking, Mobile Money payments, and maintenance in one place.";
