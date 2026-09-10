import { ShoppingCart } from "lucide-react";
import { AdminCard } from "../AdminCard";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus as OrderStatusValue } from "@/generated/prisma/client";

interface RecentOrder {
  id: string;
  bookPass: string;
  customerName: string;
  total: number;
  status: OrderStatusValue;
  createdAt: string;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
}

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <AdminCard
      title="Recent Orders"
      description="Latest customer orders"
      headerAction={
        <a
          href="/admin/orders"
          className="text-caption font-semibold text-brand-on hover:underline"
        >
          View all
        </a>
      }
    >
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingCart className="mb-2 size-8 text-text-muted" aria-hidden />
          <p className="text-body-sm text-text-muted">
            No orders yet. Orders will appear here once customers start purchasing.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-caption font-semibold text-text-muted">Order</th>
                <th className="pb-2 text-caption font-semibold text-text-muted">Customer</th>
                <th className="pb-2 text-caption font-semibold text-text-muted">Total</th>
                <th className="pb-2 text-caption font-semibold text-text-muted">Status</th>
                <th className="pb-2 text-caption font-semibold text-text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-2.5 text-body-sm font-medium text-text">
                    {order.bookPass}
                  </td>
                  <td className="py-2.5 text-body-sm text-text-secondary">
                    {order.customerName}
                  </td>
                  <td className="py-2.5 text-body-sm font-semibold text-text">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-2.5">
                    <Badge
                      semantic={
                        order.status === "DELIVERED" || order.status === "SHIPPED"
                          ? "success"
                          : order.status === "REJECTED" || order.status === "CANCELLED"
                            ? "error"
                            : order.status === "PLACED"
                              ? "info"
                              : "pending"
                      }
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-caption text-text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
