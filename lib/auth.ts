import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { scrypt, randomBytes, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt);

// ── Config ──────────────────────────────────────────────────────────────────

const COOKIE_NAME = "bookie_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  const secret = process.env.BOOKIE_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BOOKIE_AUTH_SECRET is not set. Add it to .env — generate one with:\n" +
        "  openssl rand -base64 32",
    );
  }
  return secret;
}

// ── Password hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return buf.toString("hex") === hash;
}

// ── Session ─────────────────────────────────────────────────────────────────

interface SessionPayload {
  userId: string;
}

function sign(payload: string): string {
  const secret = getAuthSecret();
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function unsign(signed: string): string | null {
  const secret = getAuthSecret();
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = signed.slice(0, idx);
  const signature = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (signature !== expected) return null;
  return payload;
}

/** Create or update the admin session cookie (server action context). */
export async function setSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ userId } satisfies SessionPayload);
  const signed = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    // secure: process.env.NODE_ENV === "production", // enable in production with HTTPS
  });
}

/** Destroy the admin session cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Session validation ──────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
}

/**
 * Read the session cookie and return the authenticated user, or null.
 * This is a server-only function — never imported in client components.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const signed = cookieStore.get(COOKIE_NAME)?.value;
  if (!signed) return null;

  const payload = unsign(signed);
  if (!payload) return null;

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!parsed.userId || typeof parsed.userId !== "string") return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Require an authenticated admin user. If not logged in or not an admin,
 * redirect to /admin/login.
 *
 * Use in server components / route handlers:
 * ```ts
 * const user = await requireAdmin();
 * ```
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    redirect("/admin/login");
  }
  return user;
}
