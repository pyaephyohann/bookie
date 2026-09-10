"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-h4 mb-4 text-center text-text">Sign in to admin</h2>

        {state.error && (
          <div
            role="alert"
            className="mb-4 rounded-control border border-error/30 bg-error-muted px-3 py-2 text-body-sm text-error"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="text-label mb-1 block text-text">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="admin@bookie.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-label mb-1 block text-text">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        block
        isLoading={isPending}
        className="h-11"
      >
        <LogIn className="size-4" aria-hidden />
        Sign in
      </Button>
    </form>
  );
}
