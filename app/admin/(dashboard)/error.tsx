"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-error-muted mx-auto">
          <AlertCircle className="size-7 text-error" aria-hidden />
        </span>
        <h2 className="text-h3 mt-4 text-text">Something went wrong</h2>
        <p className="text-body mt-2 text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-caption mt-2 text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
        <Button variant="outline" onClick={reset} className="mt-6">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}
