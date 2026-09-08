import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma ORM v7 configuration for the Prisma CLI (migrate, db push, etc.).
// Runtime queries do NOT use this file — the app connects through the
// driver adapter in lib/prisma.ts.
//
// Intentionally tolerant of a missing DATABASE_URL so that commands that
// don't touch a database (validate, generate) keep working before the
// environment file is created.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
