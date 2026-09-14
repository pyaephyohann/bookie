"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  fd,
  toFieldErrors,
  type UserActionState,
} from "@/lib/admin/users";


function refreshUserViews() {
  revalidatePath("/admin/settings/users", "page");
  revalidatePath("/admin/settings", "page");
}

// ── Create User ─────────────────────────────────────────────────────────────

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const currentUser = await requireAdmin();

  // Only ADMIN can create users
  if (currentUser.role !== "ADMIN") {
    return { error: "Only administrators can create user accounts." };
  }

  const parsed = createUserSchema.safeParse({
    name: fd(formData, "name"),
    email: fd(formData, "email").toLowerCase(),
    role: fd(formData, "role"),
    password: fd(formData, "password"),
    confirmPassword: fd(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { name, email, role, password } = parsed.data;

  try {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { email: "An account with that email already exists." },
      };
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("[bookie] createUserAction failed:", error);
    return { error: "Could not create the user. Please try again." };
  }

  refreshUserViews();
  redirect("/admin/settings/users?notice=created");
}

// ── Update User ─────────────────────────────────────────────────────────────

export async function updateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const currentUser = await requireAdmin();

  // Only ADMIN can update users
  if (currentUser.role !== "ADMIN") {
    return { error: "Only administrators can edit user accounts." };
  }

  const id = fd(formData, "id");
  if (!id) return { error: "Missing user reference." };

  const parsed = updateUserSchema.safeParse({
    name: fd(formData, "name"),
    email: fd(formData, "email").toLowerCase(),
    role: fd(formData, "role"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { name, email, role } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
    if (!existing) return { error: "That user no longer exists." };

    // Prevent removing the last active admin
    if (
      existing.role === "ADMIN" &&
      existing.isActive &&
      role !== "ADMIN"
    ) {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: "ADMIN", isActive: true, NOT: { id } },
      });
      if (otherActiveAdmins === 0) {
        return {
          error:
            "Cannot change this user's role — they are the only active administrator.",
        };
      }
    }

    // Check for duplicate email (excluding self)
    const emailClash = await prisma.user.findFirst({
      where: { email, NOT: { id } },
      select: { id: true },
    });
    if (emailClash) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { email: "An account with that email already exists." },
      };
    }

    await prisma.user.update({
      where: { id },
      data: { name, email, role },
    });
  } catch (error) {
    console.error("[bookie] updateUserAction failed:", error);
    return { error: "Could not save the user. Please try again." };
  }

  refreshUserViews();
  redirect(`/admin/settings/users/${id}?notice=updated`);
}

// ── Toggle Active ───────────────────────────────────────────────────────────

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const currentUser = await requireAdmin();

  if (currentUser.role !== "ADMIN") {
    redirect("/admin/settings/users?notice=permission-denied");
  }

  const id = fd(formData, "id");
  if (!id) redirect("/admin/settings/users?notice=not-found");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) redirect("/admin/settings/users?notice=not-found");

  // Prevent self-deactivation
  if (target.id === currentUser.id && target.isActive) {
    redirect("/admin/settings/users?notice=self-deactivate");
  }

  // Prevent deactivating the last active admin
  if (target.role === "ADMIN" && target.isActive) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, NOT: { id } },
    });
    if (otherActiveAdmins === 0) {
      redirect("/admin/settings/users?notice=last-admin");
    }
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !target.isActive },
  });

  refreshUserViews();
  redirect(
    `/admin/settings/users?notice=${target.isActive ? "deactivated" : "activated"}`,
  );
}

// ── Reset Password ──────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const currentUser = await requireAdmin();

  if (currentUser.role !== "ADMIN") {
    return { error: "Only administrators can reset passwords." };
  }

  const id = fd(formData, "id");
  if (!id) return { error: "Missing user reference." };

  const parsed = resetPasswordSchema.safeParse({
    password: fd(formData, "password"),
    confirmPassword: fd(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return { error: "That user no longer exists." };

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  } catch (error) {
    console.error("[bookie] resetPasswordAction failed:", error);
    return { error: "Could not reset the password. Please try again." };
  }

  return { success: "Password has been reset successfully." };
}
