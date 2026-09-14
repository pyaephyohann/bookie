import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserForm } from "../UserForm";
import { createUserAction } from "../actions";

export const metadata: Metadata = {
  title: "New user — Bookie Admin",
};

export default async function NewUserPage() {
  const user = await requireAdmin();

  if (user.role !== "ADMIN") {
    return (
      <div>
        <Link
          href="/admin/settings/users"
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to users
        </Link>
        <AdminPageHeader title="New user" description="Create a new admin or staff account." />
        <EmptyState
          icon={Shield}
          title="Administrator access required"
          description="Only administrators can create user accounts."
        />
      </div>
    );
  }

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
        title="New user"
        description="Create a new admin or staff account."
      />

      <UserForm
        mode="create"
        action={createUserAction}
        initial={{ name: "", email: "", role: "STAFF" }}
      />
    </div>
  );
}
