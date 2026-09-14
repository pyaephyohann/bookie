"use client";

import Link from "next/link";
import { Pencil, RotateCcw } from "lucide-react";
import { AdminConfirmSubmit } from "@/components/admin/AdminConfirmSubmit";
import { buttonVariants } from "@/components/ui/button";
import { toggleUserActiveAction } from "./actions";

interface UserRowActionsProps {
  id: string;
  name: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  isCurrentUser: boolean;
  isLastActiveAdmin: boolean;
}

export function UserRowActions({
  id,
  name,
  isActive,
  isCurrentUser,
  isLastActiveAdmin,
}: UserRowActionsProps) {
  const canDeactivate = !isCurrentUser && !isLastActiveAdmin;
  const deactivateBlockedReason = isCurrentUser
    ? "You cannot deactivate your own account"
    : isLastActiveAdmin
      ? "This is the only active administrator"
      : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/admin/settings/users/${id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          aria-label={`Edit ${name}`}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Link>

        <Link
          href={`/admin/settings/users/${id}#password`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          aria-label={`Reset password for ${name}`}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Password
        </Link>

        {canDeactivate ? (
          <form action={toggleUserActiveAction}>
            <input type="hidden" name="id" value={id} />
            <AdminConfirmSubmit
              question={
                isActive
                  ? `Deactivate ${name}?`
                  : `Activate ${name}?`
              }
              confirmLabel={isActive ? "Deactivate" : "Activate"}
              variant="ghost"
              ariaLabel={isActive ? `Deactivate ${name}` : `Activate ${name}`}
            >
              {isActive ? "Deactivate" : "Activate"}
            </AdminConfirmSubmit>
          </form>
        ) : (
          <span
            className="text-caption text-text-muted"
            title={deactivateBlockedReason ?? ""}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Desktop table row actions (simpler — no inline password reset). */
export function UserTableRowActions({
  id,
  name,
  isActive,
  isCurrentUser,
  isLastActiveAdmin,
}: UserRowActionsProps) {
  const canDeactivate = !isCurrentUser && !isLastActiveAdmin;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/admin/settings/users/${id}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        aria-label={`Edit ${name}`}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>

      <Link
        href={`/admin/settings/users/${id}#password`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        aria-label={`Reset password for ${name}`}
      >
        <RotateCcw className="size-3.5" aria-hidden />
      </Link>

      {canDeactivate ? (
        <form action={toggleUserActiveAction}>
          <input type="hidden" name="id" value={id} />
          <AdminConfirmSubmit
            question={
              isActive ? `Deactivate ${name}?` : `Activate ${name}?`
            }
            confirmLabel={isActive ? "Deactivate" : "Activate"}
            variant="ghost"
            ariaLabel={isActive ? `Deactivate ${name}` : `Activate ${name}`}
          >
            {isActive ? "Deactivate" : "Activate"}
          </AdminConfirmSubmit>
        </form>
      ) : (
        <span className="text-caption text-text-muted">
          {isActive ? "Active" : "Inactive"}
        </span>
      )}
    </div>
  );
}
