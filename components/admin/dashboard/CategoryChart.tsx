import { FolderOpen } from "lucide-react";
import { AdminCard } from "../AdminCard";
import type { CategorySales } from "@/lib/admin/dashboard-queries";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

const CATEGORY_COLORS = [
  "var(--color-brand)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-pending)",
  "var(--color-error)",
  "var(--color-warning)",
  "var(--color-neutral)",
  "var(--color-info-strong)",
];

interface CategoryChartProps {
  data: CategorySales[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

  if (data.length === 0) {
    return (
      <AdminCard
        title="Sales by Category"
        description="Category revenue breakdown"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderOpen className="mb-2 size-8 text-text-muted" aria-hidden />
          <p className="text-body-sm text-text-muted">
            No category sales data yet. Sales will appear here once orders are placed.
          </p>
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      title="Sales by Category"
      description="Revenue breakdown by book category"
      headerAction={
        <span className="text-caption text-text-muted">
          {formatCurrency(totalRevenue)} total
        </span>
      }
    >
      <div className="space-y-3">
        {data.map((cat, i) => {
          const pct = totalRevenue > 0 ? (cat.totalRevenue / totalRevenue) * 100 : 0;
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

          return (
            <div key={cat.slug}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-body-sm font-medium text-text">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 text-caption text-text-muted">
                  <span>{cat.orderCount} orders</span>
                  <span className="font-semibold text-text">{formatCurrency(cat.totalRevenue)}</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
