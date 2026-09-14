"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "./actions";
import type { UserActionState } from "@/lib/admin/users";

interface PasswordResetFormProps {
  userId: string;
  userName: string;
}

export function PasswordResetForm({ userId, userName }: PasswordResetFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction as (
      prev: UserActionState,
      formData: FormData,
    ) => Promise<UserActionState>,
    {},
  );

  if (state.success) {
    return (
      <div
        role="status"
        className="rounded-control border border-success/30 bg-success-muted px-3 py-2.5 text-body-sm text-success"
      >
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <input type="hidden" name="id" value={userId} />

      <div>
        <label htmlFor="reset-password" className="text-label mb-1 block text-text">
          New password
        </label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          placeholder="Minimum 8 characters"
          aria-invalid={!!state.fieldErrors?.password}
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-caption text-error">{state.fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="reset-confirmPassword"
          className="text-label mb-1 block text-text"
        >
          Confirm password
        </label>
        <Input
          id="reset-confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
        />
        {state.fieldErrors?.confirmPassword && (
          <p className="mt-1 text-caption text-error">
            {state.fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error"
        >
          {state.error}
        </div>
      )}

      <Button type="submit" variant="outline" isLoading={pending}>
        Reset password for {userName}
      </Button>
    </form>
  );
}
