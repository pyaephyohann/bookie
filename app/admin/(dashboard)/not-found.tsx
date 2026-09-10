import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-muted mx-auto">
          <FileQuestion className="size-7 text-text-muted" aria-hidden />
        </span>
        <h2 className="text-h3 mt-4 text-text">Page not found</h2>
        <p className="text-body mt-2 text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-control border border-border-strong bg-surface px-4 text-button text-text transition-colors hover:bg-surface-muted"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
