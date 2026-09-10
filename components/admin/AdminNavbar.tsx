"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminProfileMenu } from "./AdminProfileMenu";

interface AdminNavbarProps {
  user: { name: string; email: string };
  onToggleSidebar: () => void;
}

export function AdminNavbar({ user, onToggleSidebar }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile sidebar trigger */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="mr-3 flex size-8 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Branding */}
      <Link href="/admin" className="flex items-center gap-2">
        <span className="text-fun text-lg text-text">Bookie</span>
        <span className="rounded bg-brand/20 px-1.5 py-0.5 text-caption font-semibold text-text">
          Admin
        </span>
      </Link>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <AdminProfileMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
