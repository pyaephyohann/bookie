"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CreditCard,
  FolderOpen,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: "Soon";
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Books", href: "/admin/catalog/books", icon: BookMarked },
      { label: "Authors", href: "/admin/catalog/authors", icon: Users },
      { label: "Categories", href: "/admin/catalog/categories", icon: FolderOpen },
      { label: "Publishers", href: "/admin/catalog/publishers", icon: Tag },
    ],
  },
  {
    label: "",
    items: [
      { label: "Inventory", href: "/admin/inventory", icon: Package },
      { label: "Orders", href: "/admin/orders", icon: BookOpen },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, badge: "Soon" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Reading Content", href: "/admin/content/reading", icon: BookOpen, badge: "Soon" },
      { label: "Featured Books", href: "/admin/content/featured", icon: Star, badge: "Soon" },
      { label: "Promotions", href: "/admin/content/promotions", icon: Tag, badge: "Soon" },
    ],
  },
  {
    label: "",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, badge: "Soon" },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeydown);
    return () => panel.removeEventListener("keydown", onKeydown);
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section, si) => (
        <div key={si} className={si > 0 ? "mt-6" : ""}>
          {section.label && (
            <p className="mb-2 px-3 text-caption font-semibold uppercase tracking-wider text-text-muted">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-control px-3 py-2 text-body-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-brand/15 font-semibold text-text"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {/* Logo area */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-fun text-lg text-text">Bookie</span>
            <span className="rounded bg-brand/20 px-1.5 py-0.5 text-caption font-semibold text-text">
              Admin
            </span>
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* Drawer */}
          <div
            ref={panelRef}
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-lg"
            role="dialog"
            aria-label="Admin navigation"
          >
            {/* Close button + brand */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Link href="/admin" onClick={onClose} className="flex items-center gap-2">
                <span className="text-fun text-lg text-text">Bookie</span>
                <span className="rounded bg-brand/20 px-1.5 py-0.5 text-caption font-semibold text-text">
                  Admin
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="flex size-8 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
