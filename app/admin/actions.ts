"use server";

import { redirect } from "next/navigation";
import { verifyPassword, setSession, destroySession, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface LoginResult {
  error?: string;
}

/**
 * Log in an admin user. Validates credentials against the User table,
 * creates a session cookie, and redirects to /admin on success.
 */
export async function loginAction(
  _prevState: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      return { error: "Invalid email or password." };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password." };
    }

    await setSession(user.id);
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/admin");
}

/** Log out the admin user and redirect to the login page. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/** Get the current admin user (for server component consumption). */
export async function getCurrentAdmin() {
  return getSessionUser();
}
