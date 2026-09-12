import type { Metadata } from "next";
import { Eye, Key, User } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings — Bookie Admin",
};

export default async function AdminSettingsPage() {
  const user = await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Manage your admin account and store preferences."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Admin Account */}
        <AdminCard
          title="Admin Account"
          description="Your account information"
          headerAction={
            <span className="flex items-center gap-1.5 text-caption text-text-muted">
              <User className="size-3.5" aria-hidden />
              Account
            </span>
          }
        >
          <div className="space-y-3">
            <div>
              <p className="text-caption text-text-muted">Name</p>
              <p className="text-body font-medium text-text">{user.name}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Email</p>
              <p className="text-body font-medium text-text">{user.email}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Role</p>
              <p className="text-body font-medium text-text">{user.role}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-caption text-text-muted">
                Contact the system administrator to update account details.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Appearance */}
        <AdminCard
          title="Appearance"
          description="Theme preferences"
          headerAction={
            <span className="flex items-center gap-1.5 text-caption text-text-muted">
              <Eye className="size-3.5" aria-hidden />
              Appearance
            </span>
          }
        >
          <div className="space-y-3">
            <p className="text-body-sm text-text-secondary">
              Theme is managed through the top-right theme toggle (Light / Dark / System).
            </p>
            <div className="rounded-control border border-border bg-surface-muted p-3">
              <p className="text-body-sm text-text-secondary">
                Theme switching is available through the top-right toggle.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Security */}
        <AdminCard
          title="Security"
          description="Security and permissions"
          headerAction={
            <span className="flex items-center gap-1.5 text-caption text-text-muted">
              <Key className="size-3.5" aria-hidden />
              Security
            </span>
          }
        >
          <div className="space-y-3">
            <div className="rounded-control border border-border bg-surface-muted p-3">
              <p className="text-body-sm font-medium text-text">Session</p>
              <p className="text-caption text-text-muted">
                You are currently signed in. Sessions expire after 7 days.
              </p>
            </div>
            <div className="rounded-control border border-border bg-surface-muted p-3">
              <p className="text-body-sm font-medium text-text">Permissions</p>
              <p className="text-caption text-text-muted">
                Role-based access control. Admin and Staff roles are supported.
              </p>
            </div>

          </div>
        </AdminCard>
      </div>
    </div>
  );
}
