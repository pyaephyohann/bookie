import type { Metadata } from "next";
import Link from "next/link";
import { Shield, UserPlus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/admin/user-queries";
import { USER_ROLE_LABELS } from "@/lib/admin/users";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminFilterForm } from "@/components/admin/AdminFilterForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { UserTableRowActions, UserRowActions } from "./UserRowActions";


export const metadata: Metadata = {
  title: "Users — Bookie Admin",
};

const BASE_PATH = "/admin/settings/users";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const currentUser = await requireAdmin();

  // Non-admins cannot access user management
  if (currentUser.role !== "ADMIN") {
    return (
      <div>
        <AdminPageHeader
          title="Users"
          description="Manage admin and staff accounts."
        />
        <EmptyState
          icon={Shield}
          title="Administrator access required"
          description="Only administrators can manage user accounts."
        />
      </div>
    );
  }

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "";
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const users = await listUsers({ q, role, page });

  // Count active admins once for the deactivation guard
  const activeAdminCount = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage admin and staff accounts."
        actions={
          <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
            <UserPlus className="size-4" aria-hidden />
            New user
          </Link>
        }
      />

      <AdminFeedback code={notice} />

      <AdminFilterForm
        action={BASE_PATH}
        search={{ name: "q", value: q, label: "Search", placeholder: "Name or email…" }}
        selects={[
          {
            name: "role",
            label: "Role",
            value: role,
            options: [
              { value: "ADMIN", label: "Admin" },
              { value: "STAFF", label: "Staff" },
            ],
            allLabel: "All roles",
          },
        ]}
      />

      {users.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q || role ? "No users match that filter" : "No users yet"}
          description={
            q || role
              ? "Try a different search or clear the filter."
              : "Create the first admin or staff account to get started."
          }
          action={
            q || role ? (
              <Link href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                Clear filters
              </Link>
            ) : (
              <Link href={`${BASE_PATH}/new`} className={buttonVariants({ variant: "primary" })}>
                <UserPlus className="size-4" aria-hidden />
                New user
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-left">
              <caption className="sr-only">Admin and staff accounts</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-caption font-semibold text-text-muted">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => {
                  const isCurrentUser = user.id === currentUser.id;
                  const isLastActiveAdmin =
                    user.role === "ADMIN" &&
                    user.isActive &&
                    activeAdminCount <= 1;

                  return (
                    <tr key={user.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`${BASE_PATH}/${user.id}`}
                          className="text-body-sm font-medium text-text hover:underline"
                        >
                          {user.name}
                        </Link>
                        <span className="block text-caption text-text-muted">
                          {user.email}
                          {isCurrentUser ? " (you)" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${
                            user.role === "ADMIN"
                              ? "bg-brand/15 text-brand"
                              : "bg-surface-muted text-text-secondary"
                          }`}
                        >
                          {user.role === "ADMIN" && (
                            <Shield className="size-3" aria-hidden />
                          )}
                          {USER_ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
                            user.isActive
                              ? "bg-success-muted text-success"
                              : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <UserTableRowActions
                          id={user.id}
                          name={user.name}
                          role={user.role}
                          isActive={user.isActive}
                          isCurrentUser={isCurrentUser}
                          isLastActiveAdmin={isLastActiveAdmin}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {users.items.map((user) => {
              const isCurrentUser = user.id === currentUser.id;
              const isLastActiveAdmin =
                user.role === "ADMIN" &&
                user.isActive &&
                activeAdminCount <= 1;

              return (
                <li
                  key={user.id}
                  className="rounded-card border border-border bg-surface p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`${BASE_PATH}/${user.id}`}
                        className="text-body-sm font-semibold text-text hover:underline"
                      >
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-caption text-text-muted">
                            (you)
                          </span>
                        )}
                      </Link>
                      <p className="text-caption text-text-muted">{user.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-caption font-medium ${
                          user.role === "ADMIN"
                            ? "bg-brand/15 text-brand"
                            : "bg-surface-muted text-text-secondary"
                        }`}
                      >
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-caption font-medium ${
                          user.isActive
                            ? "bg-success-muted text-success"
                            : "bg-surface-muted text-text-muted"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border-subtle pt-3">
                    <UserRowActions
                      id={user.id}
                      name={user.name}
                      role={user.role}
                      isActive={user.isActive}
                      isCurrentUser={isCurrentUser}
                      isLastActiveAdmin={isLastActiveAdmin}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            basePath={BASE_PATH}
            page={users.page}
            pageCount={users.pageCount}
            total={users.total}
            itemLabel="users"
            params={{ q, role }}
          />
        </>
      )}
    </div>
  );
}
