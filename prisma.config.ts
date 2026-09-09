import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma ORM v7 configuration for the Prisma CLI (db push, migrate, etc.).
// Official v7 pattern: the database URL lives here, loaded from DATABASE_URL,
// and the datasource block in schema.prisma intentionally has no `url`.
//
// Runtime queries do NOT use this file — the app connects through the
// driver adapter in lib/prisma.ts, which reads process.env.DATABASE_URL
// (Next.js loads .env automatically; production hosts inject the variable).
//
// Note: env() intentionally throws if DATABASE_URL is not set, so every
// command that reaches the database fails loudly instead of silently
// misconfiguring. Commands like `prisma validate`/`generate` also load this
// config, so .env must exist in local development.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
