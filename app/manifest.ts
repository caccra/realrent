import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RealRent",
    short_name: "RealRent",
    description: "Digital leases, rent tracking, and payments for Uganda landlords and tenants.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
