"use client";

import { AdminCard } from "../AdminCard";
import { BarChart } from "../charts/BarChart";
import type { OrderStatusCount } from "@/lib/admin/dashboard-queries";

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

interface OrderChartProps {
  data: (OrderStatusCount & { color: string })[];
}

export function OrderChart({ data }: OrderChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <AdminCard
      title="Orders by Status"
      description="Current order distribution"
      headerAction={
        <span className="text-caption text-text-muted">
          {total.toLocaleString()} total
        </span>
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        {data.filter((d) => d.count > 0).map((d) => (
          <div key={d.status} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-caption text-text-muted">
              {STATUS_LABELS[d.status] ?? d.status} ({d.count})
            </span>
          </div>
        ))}
      </div>
      <BarChart
        data={data.map((d) => ({
          label: STATUS_LABELS[d.status] ?? d.status,
          value: d.count,
          color: d.color,
        }))}
        height={160}
      />
    </AdminCard>
  );
}
