import { CreditCard } from "lucide-react";
import { AdminCard } from "../AdminCard";
import { DonutChart } from "../charts/DonutChart";
import type { PaymentStats as PaymentStatsData } from "@/lib/admin/dashboard-queries";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

const METHOD_LABELS: Record<string, string> = {
  KPAY: "KPay",
  AYAPAY: "AYA Pay",
};

interface PaymentStatsProps {
  data: PaymentStatsData;
}

export function PaymentStats({ data }: PaymentStatsProps) {
  const donutSegments = [
    { label: "Verified", value: data.verified, color: "var(--color-success)" },
    { label: "Pending", value: data.pending, color: "var(--color-pending)" },
    { label: "Rejected", value: data.rejected, color: "var(--color-error)" },
  ].filter((s) => s.value > 0);

  return (
    <AdminCard
      title="Payments"
      description="Payment status and methods"
      headerAction={
        <span className="text-caption text-text-muted">
          Total: {formatCurrency(data.verified > 0 || data.pending > 0
            ? data.byMethod.reduce((s, m) => s + m.total, 0)
            : 0)}
        </span>
      }
    >
      {data.verified === 0 && data.pending === 0 && data.rejected === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CreditCard className="mb-2 size-8 text-text-muted" aria-hidden />
          <p className="text-body-sm text-text-muted">
            No payment data yet. Payments will appear here once orders are placed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Donut */}
          <div className="flex items-center justify-center">
            <DonutChart
              segments={donutSegments}
              centerValue={String(data.verified + data.pending + data.rejected)}
              centerLabel="payments"
              formatValue={(v) => String(v)}
            />
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {/* By method */}
            {data.byMethod.map((m) => (
              <div
                key={m.method}
                className="rounded-control border border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-text">
                    {METHOD_LABELS[m.method] ?? m.method}
                  </span>
                  <span className="text-body-sm font-semibold text-text">
                    {formatCurrency(m.total)}
                  </span>
                </div>
                <p className="text-caption text-text-muted">{m.count} payments</p>
              </div>
            ))}

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-control bg-success-muted p-2 text-center">
                <p className="text-body-sm font-bold text-success">{data.verified}</p>
                <p className="text-[10px] text-text-muted">Verified</p>
              </div>
              <div className="rounded-control bg-pending-muted p-2 text-center">
                <p className="text-body-sm font-bold text-pending">{data.pending}</p>
                <p className="text-[10px] text-text-muted">Pending</p>
              </div>
              <div className="rounded-control bg-error-muted p-2 text-center">
                <p className="text-body-sm font-bold text-error">{data.rejected}</p>
                <p className="text-[10px] text-text-muted">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
