"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

interface AdminProfileMenuProps {
  name: string;
  email: string;
}

export function AdminProfileMenu({ name, email }: AdminProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-control px-2 py-1.5 text-left transition-colors hover:bg-surface-muted"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand/20 text-body-sm font-semibold text-text">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-body-sm font-medium text-text lg:block">
          {name}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 rounded-card border border-border bg-surface-elevated p-1 shadow-md"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-body-sm font-medium text-text">{name}</p>
            <p className="text-caption text-text-muted">{email}</p>
          </div>
          <Link
            href="/admin/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-body-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
          <button
            type="submit"
            role="menuitem"
            form="admin-logout-form"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-body-sm text-error transition-colors hover:bg-error-muted"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}

      <form id="admin-logout-form" action={logoutAction} className="hidden" />
    </div>
  );
}
