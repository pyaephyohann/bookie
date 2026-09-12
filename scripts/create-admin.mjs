#!/usr/bin/env node

/**
 * create-admin.mjs
 *
 * Creates or promotes an admin user for Bookie.
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *
 * Prompts for email, name and password, then upserts a single ADMIN user
 * (role ADMIN, isActive true) against the database in DATABASE_URL.
 *
 * Implementation note: this script runs on plain Node, but Prisma 7's app
 * client is generated as TypeScript under `generated/prisma` (custom output),
 * which plain Node cannot import. Rather than duplicate the data layer, the
 * script reuses the project's own Prisma CLI config (`prisma.config.ts` +
 * `prisma db execute`), which resolves DATABASE_URL from .env exactly like the
 * application does. The SQL is written to a 0600 temp file that is always
 * removed, and it contains a password *hash* — never the password itself.
 *
 * Environment:
 *   DATABASE_URL — must be set (loaded from .env, or exported by the shell)
 */

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createInterface } from "node:readline";
import { scrypt, randomBytes, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { spawnSync } from "node:child_process";

const scryptAsync = promisify(scrypt);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env");

// Load .env the same way the app does. The Prisma CLI also loads it, but we
// check up front so a missing value fails with a clear message.
let envFound = false;
try {
  const envContent = readFileSync(envPath, "utf-8");
  envFound = true;
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // Fall through — DATABASE_URL may already be exported by the shell.
}

if (!process.env.DATABASE_URL) {
  console.error(
    envFound
      ? "DATABASE_URL is not set. Add it to .env (see .env.example)."
      : "Could not read .env. Make sure DATABASE_URL is set.",
  );
  process.exit(1);
}

// ── Input ───────────────────────────────────────────────────────────────────
// One readline interface for the whole session. Creating several interfaces on
// the same stream loses buffered input (closing one discards the rest), so all
// prompts read from a single shared line queue — which also lets piped input
// work, not just an interactive terminal.

const stdinIsTTY = Boolean(process.stdin.isTTY);
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: stdinIsTTY,
});

const queuedLines = [];
const lineWaiters = [];

rl.on("line", (line) => {
  const waiter = lineWaiters.shift();
  if (waiter) waiter(line);
  else queuedLines.push(line);
});

function nextLine() {
  if (queuedLines.length > 0) return Promise.resolve(queuedLines.shift());
  return new Promise((res) => lineWaiters.push(res));
}

/**
 * Prompt for one line. Passwords are masked on a real terminal; when stdin is
 * not a TTY (pipes/CI) readline already does not echo, so the value stays out
 * of logs either way.
 */
function ask(question, { mask = false } = {}) {
  // `_writeToOutput` is the standard (if private) hook for suppressing echo.
  const originalWriter = mask && stdinIsTTY ? rl._writeToOutput : null;
  if (originalWriter) rl._writeToOutput = () => {};

  process.stdout.write(question);

  return nextLine().then((line) => {
    if (originalWriter) {
      rl._writeToOutput = originalWriter;
      process.stdout.write("\n");
    }
    return line.trim();
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${salt}:${buf.toString("hex")}`;
}

/** Quote a value as a SQL string literal. */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Run SQL through the project's Prisma CLI. Returns true on success.
 * The SQL is written to a 0600 temp file and always removed.
 */
function runSql(sql) {
  const tempFile = join(tmpdir(), `bookie-admin-${randomUUID()}.sql`);
  try {
    writeFileSync(tempFile, sql, { mode: 0o600 });
    const result = spawnSync(
      "npx",
      ["--no-install", "prisma", "db", "execute", "--file", tempFile],
      {
        cwd: projectRoot,
        encoding: "utf-8",
        shell: process.platform === "win32",
      },
    );

    if (result.status !== 0) {
      const detail = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
      console.error(
        "\nDatabase error:",
        detail.split("\n").find((l) => l.trim()) || "unknown error",
      );
      if (/Authentication failed|password authentication/i.test(detail)) {
        console.error("PostgreSQL rejected the credentials in DATABASE_URL.");
      } else if (/ECONNREFUSED|Connection refused/i.test(detail)) {
        console.error("Could not reach PostgreSQL. Is the server running?");
      }
      return false;
    }
    return true;
  } finally {
    rmSync(tempFile, { force: true });
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

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
  const normalizedEmail = email.toLowerCase();

  console.log(`\nSaving admin user: ${normalizedEmail}`);

  // Single upsert: creates the admin, or promotes/refreshes an existing user.
  // ON CONFLICT keeps this idempotent — running it twice can never create a
  // duplicate account, and role/isActive are always forced to the admin state.
  const sql = `
INSERT INTO "User" (id, name, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (${sqlString(randomUUID())}, ${sqlString(name)}, ${sqlString(
    normalizedEmail,
  )}, ${sqlString(passwordHash)}, 'ADMIN', true, now(), now())
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      "passwordHash" = EXCLUDED."passwordHash",
      role = 'ADMIN',
      "isActive" = true,
      "updatedAt" = now();
`;

  if (!runSql(sql)) {
    console.error("\nMake sure the database is running and the User table exists.");
    process.exit(1);
  }

  console.log("✅ Done! Admin user is ready.");
  console.log(`   ${normalizedEmail} — role ADMIN, active.`);
  console.log(
    "   (An existing account with this email would have been promoted and its password updated.)",
  );
}

main()
  .then(() => rl.close())
  .catch((error) => {
    console.error("Unexpected error:", error?.message ?? error);
    rl.close();
    process.exit(1);
  });
