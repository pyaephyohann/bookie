import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma ORM v7 requires a driver adapter; PrismaPg wraps the `pg` driver
// and reads its connection string from DATABASE_URL (loaded from .env by
// Next.js in dev/build, or by your process manager in production).
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting database connections. Never assigned in production.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
