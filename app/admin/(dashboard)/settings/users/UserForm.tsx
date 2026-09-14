"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { USER_ROLE_VALUES, USER_ROLE_LABELS, type UserActionState } from "@/lib/admin/users";

interface UserFormProps {
  mode: "create" | "edit";
  action: (
    prevState: UserActionState,
    formData: FormData,
  ) => Promise<UserActionState>;
  userId?: string;
  initial?: {
    name: string;
    email: string;
    role: string;
  };
}

export function UserForm({ mode, action, userId, initial }: UserFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {userId && <input type="hidden" name="id" value={userId} />}

      {/* Name */}
      <div>
        <label htmlFor="name" className="text-label mb-1 block text-text">
          Name
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          placeholder="Full name"
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-caption text-error">{state.fieldErrors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-label mb-1 block text-text">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          placeholder="user@example.com"
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-caption text-error">{state.fieldErrors.email}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="text-label mb-1 block text-text">
          Role
        </label>
        <Select
          id="role"
          name="role"
          defaultValue={initial?.role ?? "STAFF"}
          aria-invalid={!!state.fieldErrors?.role}
        >
          {USER_ROLE_VALUES.map((role) => (
            <option key={role} value={role}>
              {USER_ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        {state.fieldErrors?.role && (
          <p className="mt-1 text-caption text-error">{state.fieldErrors.role}</p>
        )}
      </div>

      {/* Password (create only) */}
      {mode === "create" && (
        <>
          <div>
            <label htmlFor="password" className="text-label mb-1 block text-text">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <p className="mt-1 text-caption text-error">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-label mb-1 block text-text"
            >
              Confirm password
            </label>
            <Input
              id="confirmPassword"
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
        </>
      )}

      {/* Error */}
      {state.error && (
        <div
          role="alert"
          className="rounded-control border border-error/30 bg-error-muted px-3 py-2.5 text-body-sm text-error"
        >
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={pending}>
          {mode === "create" ? "Create user" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
