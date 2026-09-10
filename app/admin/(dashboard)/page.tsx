import type { Metadata } from "next";
import {
  BookMarked,
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard — Bookie Admin",
};

const PLACEHOLDER_STATS = [
  { label: "Total Books", icon: BookMarked, value: "—", description: "Catalogued books" },
  { label: "Total Orders", icon: ShoppingCart, value: "—", description: "Orders received" },
  { label: "Revenue", icon: TrendingUp, value: "—", description: "Total revenue" },
  { label: "Inventory", icon: Package, value: "—", description: "In-stock items" },
];

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Here's an overview of your Bookie store.`}
      />

      {/* KPI cards — placeholder for A2 analytics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => (
          <AdminCard key={stat.label}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-control bg-surface-muted">
                <stat.icon className="size-5 text-text-muted" aria-hidden />
              </span>
              <div>
                <p className="text-body-sm text-text-muted">{stat.label}</p>
                <p className="text-h2 text-text">{stat.value}</p>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Content sections — ready for A2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard
          title="Recent Orders"
          description="Latest customer orders"
          headerAction={
            <a href="/admin/orders" className="text-caption font-semibold text-brand-on hover:underline">
              View all
            </a>
          }
        >
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="mb-2 size-8 text-text-muted" aria-hidden />
            <p className="text-body-sm text-text-muted">
              Order analytics will appear here once real data is connected.
            </p>
          </div>
        </AdminCard>

        <AdminCard
          title="Inventory"
          description="Stock levels and alerts"
          headerAction={
            <a href="/admin/inventory" className="text-caption font-semibold text-brand-on hover:underline">
              Manage
            </a>
          }
        >
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="mb-2 size-8 text-text-muted" aria-hidden />
            <p className="text-body-sm text-text-muted">
              Inventory data will appear here once real data is connected.
            </p>
          </div>
        </AdminCard>

        <AdminCard
          title="Revenue"
          description="Payment and revenue overview"
          headerAction={
            <a href="/admin/payments" className="text-caption font-semibold text-brand-on hover:underline">
              View payments
            </a>
          }
        >
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="mb-2 size-8 text-text-muted" aria-hidden />
            <p className="text-body-sm text-text-muted">
              Revenue analytics will appear here once real data is connected.
            </p>
          </div>
        </AdminCard>

        <AdminCard
          title="Quick Actions"
          description="Common admin tasks"
        >
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/catalog/books"
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-body-sm text-text-secondary transition-colors hover:bg-surface-muted"
            >
              <BookMarked className="size-4" aria-hidden />
              Manage Books
            </a>
            <a
              href="/admin/catalog/categories"
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-body-sm text-text-secondary transition-colors hover:bg-surface-muted"
            >
              <LayoutDashboard className="size-4" aria-hidden />
              Categories
            </a>
            <a
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-body-sm text-text-secondary transition-colors hover:bg-surface-muted"
            >
              <ShoppingCart className="size-4" aria-hidden />
              Orders
            </a>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
