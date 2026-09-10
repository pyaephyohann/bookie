import type { Metadata } from "next";
import {
  getKpiData,
  getRevenueData,
  getOrdersByStatus,
  getOrdersOverTime,
  getCategorySales,
  getPaymentStats,
  getInventoryAlerts,
  getRecentOrders,
} from "@/lib/admin/dashboard-queries";
import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCards } from "@/components/admin/dashboard/KpiCards";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { OrderChart } from "@/components/admin/dashboard/OrderChart";
import { CategoryChart } from "@/components/admin/dashboard/CategoryChart";
import { PaymentStats } from "@/components/admin/dashboard/PaymentStats";
import { InventoryAlerts } from "@/components/admin/dashboard/InventoryAlerts";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";

export const metadata: Metadata = {
  title: "Dashboard — Bookie Admin",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  // Fetch all dashboard data in parallel
  const [
    kpi,
    revenue30,
    revenue90,
    ordersByStatus,
    ordersOverTime,
    categorySales,
    paymentStats,
    inventoryAlerts,
    recentOrders,
  ] = await Promise.all([
    getKpiData(),
    getRevenueData(30),
    getRevenueData(90),
    getOrdersByStatus(),
    getOrdersOverTime(30),
    getCategorySales(),
    getPaymentStats(),
    getInventoryAlerts(),
    getRecentOrders(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Here's an overview of your Bookie store.`}
      />

      {/* KPI Overview */}
      <KpiCards data={kpi} />

      {/* Revenue + Orders row */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart data30={revenue30} data90={revenue90} />
        <OrderChart data={ordersByStatus} />
      </div>

      {/* Category + Payments row */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryChart data={categorySales} />
        <PaymentStats data={paymentStats} />
      </div>

      {/* Orders over time */}
      <div className="mb-6">
        <div className="rounded-card border border-border bg-surface shadow-xs p-6">
          <h3 className="text-h4 mb-1 text-text">Order Activity</h3>
          <p className="text-caption mb-4 text-text-muted">Orders placed over time (30 days)</p>
          <div className="overflow-x-auto">
            {ordersOverTime.length === 0 ? (
              <p className="text-body-sm py-8 text-center text-text-muted">
                No order activity yet.
              </p>
            ) : (
              <svg
                viewBox={`0 0 400 200`}
                className="w-full"
                role="img"
                aria-label="Order activity line chart"
              >
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                  <line
                    key={pct}
                    x1={0}
                    y1={30 + 140 * (1 - pct)}
                    x2={400}
                    y2={30 + 140 * (1 - pct)}
                    stroke="var(--color-border-subtle)"
                    strokeWidth={1}
                    strokeDasharray={pct === 0 ? "none" : "3 3"}
                  />
                ))}
                {/* Stacked area: placed + confirmed + delivered */}
                {(() => {
                  const max = Math.max(
                    ...ordersOverTime.map((d) => d.placed + d.confirmed + d.delivered),
                    1,
                  );
                  const stepX = ordersOverTime.length > 1 ? 400 / (ordersOverTime.length - 1) : 200;
                  const toY = (val: number) => 30 + 140 * (1 - val / max);

                  const placedPath = ordersOverTime
                    .map((d, i) => {
                      const x = i * stepX;
                      const y = toY(d.placed);
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ");

                  const confirmedPath = ordersOverTime
                    .map((d, i) => {
                      const x = i * stepX;
                      const y = toY(d.placed + d.confirmed);
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ");

                  const deliveredPath = ordersOverTime
                    .map((d, i) => {
                      const x = i * stepX;
                      const y = toY(d.placed + d.confirmed + d.delivered);
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ");

                  const lastX = (ordersOverTime.length - 1) * stepX;

                  return (
                    <>
                      <path d={placedPath} fill="none" stroke="var(--color-info)" strokeWidth={2} strokeLinecap="round" />
                      <path d={confirmedPath} fill="none" stroke="var(--color-success)" strokeWidth={2} strokeLinecap="round" />
                      <path d={deliveredPath} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinecap="round" />

                      {/* Labels at end */}
                      {ordersOverTime.length > 0 && (
                        <>
                          <circle cx={lastX} cy={toY(ordersOverTime[ordersOverTime.length - 1].placed)} r={3} fill="var(--color-info)" />
                          <circle cx={lastX} cy={toY(ordersOverTime[ordersOverTime.length - 1].placed + ordersOverTime[ordersOverTime.length - 1].confirmed)} r={3} fill="var(--color-success)" />
                          <circle cx={lastX} cy={toY(ordersOverTime[ordersOverTime.length - 1].placed + ordersOverTime[ordersOverTime.length - 1].confirmed + ordersOverTime[ordersOverTime.length - 1].delivered)} r={3} fill="var(--color-brand)" />
                        </>
                      )}

                      {/* X-axis labels */}
                      {ordersOverTime.map((d, i) => {
                        const maxLabels = 8;
                        const labelStep = Math.max(1, Math.floor(ordersOverTime.length / maxLabels));
                        if (i % labelStep !== 0 && i !== ordersOverTime.length - 1) return null;
                        return (
                          <text
                            key={i}
                            x={i * stepX}
                            y={185}
                            textAnchor="middle"
                            className="fill-text-muted"
                            fontSize={9}
                          >
                            {d.label.length > 6 ? d.label.slice(0, 5) + "…" : d.label}
                          </text>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-info" />
              <span className="text-caption text-text-muted">Placed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-success" />
              <span className="text-caption text-text-muted">Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-brand" />
              <span className="text-caption text-text-muted">Delivered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory + Recent Orders */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InventoryAlerts data={inventoryAlerts} />
        <RecentOrders
          orders={recentOrders.map((o) => ({
            ...o,
            status: o.status as "PLACED" | "CONFIRMED" | "REJECTED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
          }))}
        />
      </div>
    </div>
  );
}
