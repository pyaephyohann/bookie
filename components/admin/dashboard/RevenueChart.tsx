"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { AdminCard } from "../AdminCard";
import { LineChart } from "../charts/LineChart";
import type { RevenuePoint } from "@/lib/admin/dashboard-queries";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

interface RevenueChartProps {
  data30: RevenuePoint[];
  data90: RevenuePoint[];
}

export function RevenueChart({ data30, data90 }: RevenueChartProps) {
  const [range, setRange] = useState<"30" | "90">("30");
  const data = range === "30" ? data30 : data90;

  return (
    <AdminCard
      title="Revenue"
      description="Verified payment revenue over time"
      headerAction={
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setRange("30")}
            className={`rounded-control px-2.5 py-1 text-caption font-semibold transition-colors ${
              range === "30"
                ? "bg-brand text-brand-on"
                : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            30d
          </button>
          <button
            type="button"
            onClick={() => setRange("90")}
            className={`rounded-control px-2.5 py-1 text-caption font-semibold transition-colors ${
              range === "90"
                ? "bg-brand text-brand-on"
                : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            90d
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <DollarSign className="size-4 text-text-muted" aria-hidden />
        <span className="text-body-sm text-text-muted">
          Total: <span className="font-semibold text-text">{formatCurrency(data.reduce((s, d) => s + d.revenue, 0))}</span>
        </span>
      </div>
      <LineChart
        labels={data.map((d) => d.label)}
        series={[
          {
            label: "Revenue",
            color: "var(--color-brand)",
            data: data.map((d) => d.revenue),
          },
        ]}
        formatValue={formatCurrency}
      />
    </AdminCard>
  );
}
