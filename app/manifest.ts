import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kezavi",
    short_name: "Kezavi",
    description: "Digital leases, rent tracking, and payments for Uganda landlords and tenants.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EE",
    theme_color: "#1B4D3A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
