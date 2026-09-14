import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getUserForEdit } from "@/lib/admin/user-queries";
import { USER_ROLE_LABELS } from "@/lib/admin/users";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminCard } from "@/components/admin/AdminCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserForm } from "../UserForm";
import { PasswordResetForm } from "../PasswordResetForm";
import { updateUserAction } from "../actions";

export const metadata: Metadata = {
  title: "Edit user — Bookie Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditUserPage({ params, searchParams }: PageProps) {
  const currentUser = await requireAdmin();

  if (currentUser.role !== "ADMIN") {
    return (
      <div>
        <Link
          href="/admin/settings/users"
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to users
        </Link>
        <AdminPageHeader title="Edit user" description="Edit an admin or staff account." />
        <EmptyState
          icon={Shield}
          title="Administrator access required"
          description="Only administrators can edit user accounts."
        />
      </div>
    );
  }

  const { id } = await params;
  const query = await searchParams;
  const notice = typeof query.notice === "string" ? query.notice : undefined;

  const user = await getUserForEdit(id);
  if (!user) notFound();

  const isCurrentUser = user.id === currentUser.id;
  return (
    <div>
      <Link
        href="/admin/settings/users"
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to users
      </Link>

      <AdminPageHeader
        title={user.name}
        description={`${USER_ROLE_LABELS[user.role]} · ${user.email} · ${user.isActive ? "Active" : "Inactive"}${isCurrentUser ? " · (you)" : ""}`}
      />

      <AdminFeedback code={notice} />

      <div className="space-y-8">
        {/* Account Details */}
        <AdminCard title="Account details" description="Name, email and role">
          <UserForm
            mode="edit"
            action={updateUserAction}
            userId={user.id}
            initial={{
              name: user.name,
              email: user.email,
              role: user.role,
            }}
          />
        </AdminCard>

        {/* Password Reset */}
        <div id="password">
          <AdminCard title="Reset password" description="Set a new password for this account">
            <p className="mb-4 text-body-sm text-text-muted">
              The current password hash is not visible. Setting a new password
              will replace it immediately.
            </p>
            <PasswordResetForm userId={user.id} userName={user.name} />
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
