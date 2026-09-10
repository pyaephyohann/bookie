#!/usr/bin/env node

/**
 * create-admin.mjs
 *
 * Creates or promotes an admin user for Bookie.
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *
 * Prompts for email and password interactively.
 * Creates a new ADMIN user or promotes an existing STAFF user.
 *
 * Environment:
 *   DATABASE_URL — must be set (loaded from .env by dotenv)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// Load .env from project root
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const envPath = resolve(__dirname, "../.env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error("Could not read .env file. Make sure DATABASE_URL is set.");
  process.exit(1);
}

// Dynamic import of Prisma (after .env is loaded)
const { PrismaClient } = await import("@/generated/prisma/client/index.js");
const { PrismaPg } = await import("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${salt}:${buf.toString("hex")}`;
}

function ask(question, { mask = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (mask) {
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      if (typeof stdin.setRawMode === "function") stdin.setRawMode(true);

      let value = "";
      const onData = (ch) => {
        const s = String(ch);
        if (s === "\n" || s === "\r") {
          if (typeof stdin.setRawMode === "function") stdin.setRawMode(wasRaw ?? false);
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(value);
        } else if (s === "\u0003") {
          process.exit();
        } else if (s === "\u007F" || s === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          value += s;
          process.stdout.write("*");
        }
      };
      stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  console.log("\n📖 Bookie — Create Admin User\n");

  const email = await ask("Email: ");
  if (!email || !email.includes("@")) {
    console.error("Invalid email.");
    process.exit(1);
  }

  const name = await ask("Name: ");
  if (!name) {
    console.error("Name is required.");
    process.exit(1);
  }

  const password = await ask("Password (min 8 chars): ", { mask: true });
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      console.log(`\nUser ${email} already exists (role: ${existing.role}).`);
      if (existing.role === "ADMIN") {
        console.log("They are already an admin. No changes needed.");
      } else {
        console.log("Promoting to ADMIN...");
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "ADMIN", passwordHash, name },
        });
        console.log("✅ Done! User promoted to ADMIN.");
      }
    } else {
      console.log(`\nCreating admin user: ${email}`);
      await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log("✅ Done! Admin user created.");
    }
  } catch (error) {
    console.error("Database error:", error.message);
    console.error("\nMake sure:");
    console.error("  1. DATABASE_URL is set correctly in .env");
    console.error("  2. The database is running");
    console.error("  3. The User table exists (run prisma db push if needed)");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
