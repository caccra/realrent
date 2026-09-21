import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` only reads the schema file and doesn't need a live
// database connection, so this falls back to a placeholder when
// DATABASE_URL isn't set yet (e.g. a fresh `npm install` on a deploy
// platform before env vars are configured). Anything that actually talks
// to the database (lib/prisma.ts, `migrate`, `db execute`, ...) reads the
// real DATABASE_URL at runtime and will fail loudly if it's missing.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
