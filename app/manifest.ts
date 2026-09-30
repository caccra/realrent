import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kezavi",
    short_name: "Kezavi",
    description: "Digital leases, rent tracking, and payments for Uganda landlords and tenants.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F6F4EE",
    theme_color: "#1B4D3A",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Browse properties",
        url: "/properties",
      },
      {
        name: "Log in",
        url: "/login",
      },
    ],
  };
}
