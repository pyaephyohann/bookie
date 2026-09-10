import { BookMarked, DollarSign, Package, ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";
import type { KpiData } from "@/lib/admin/dashboard-queries";
import { AdminCard } from "../AdminCard";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

const KPI_ITEMS = [
  {
    key: "totalRevenue" as const,
    label: "Revenue (30d)",
    icon: DollarSign,
    format: formatCurrency,
    description: "Verified payments",
  },
  {
    key: "totalOrders" as const,
    label: "Total Orders",
    icon: ShoppingCart,
    format: (v: number) => v.toLocaleString(),
    description: "All time",
  },
  {
    key: "pendingOrders" as const,
    label: "Pending Orders",
    icon: AlertTriangle,
    format: (v: number) => v.toLocaleString(),
    description: "Awaiting processing",
  },
  {
    key: "completedOrders" as const,
    label: "Completed",
    icon: CheckCircle,
    format: (v: number) => v.toLocaleString(),
    description: "Shipped or delivered",
  },
  {
    key: "totalBooks" as const,
    label: "Books",
    icon: BookMarked,
    format: (v: number) => v.toLocaleString(),
    description: "In catalog",
  },
  {
    key: "lowStockBooks" as const,
    label: "Low Stock",
    icon: Package,
    format: (v: number) => v.toLocaleString(),
    description: "≤ 5 units",
  },
];

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {KPI_ITEMS.map((item) => (
        <AdminCard key={item.key}>
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-control ${
                item.key === "lowStockBooks" && data[item.key] > 0
                  ? "bg-error-muted text-error"
                  : "bg-surface-muted text-text-muted"
              }`}
            >
              <item.icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-caption text-text-muted">{item.label}</p>
              <p className="text-h2 truncate text-text">{item.format(data[item.key])}</p>
              <p className="text-[10px] text-text-disabled">{item.description}</p>
            </div>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
