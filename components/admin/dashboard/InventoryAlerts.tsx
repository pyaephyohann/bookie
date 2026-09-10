import { Package, AlertTriangle } from "lucide-react";
import { AdminCard } from "../AdminCard";
import type { InventoryAlert } from "@/lib/admin/dashboard-queries";

interface InventoryAlertsProps {
  data: InventoryAlert[];
}

export function InventoryAlerts({ data }: InventoryAlertsProps) {
  const outOfStock = data.filter((d) => d.stockQuantity === 0);
  const lowStock = data.filter((d) => d.stockQuantity > 0 && d.stockQuantity <= 5);

  return (
    <AdminCard
      title="Inventory Alerts"
      description="Low and out-of-stock books"
      headerAction={
        data.length > 0 ? (
          <span className="rounded bg-error-muted px-1.5 py-0.5 text-caption font-semibold text-error">
            {data.length} alerts
          </span>
        ) : undefined
      }
    >
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="mb-2 size-8 text-text-muted" aria-hidden />
          <p className="text-body-sm text-text-muted">
            All published books have healthy stock levels.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Out of stock */}
          {outOfStock.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-error">
                <AlertTriangle className="size-3.5" aria-hidden />
                Out of Stock ({outOfStock.length})
              </h4>
              <div className="space-y-1.5">
                {outOfStock.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between rounded-control border border-error/20 bg-error-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-medium text-text">{book.title}</p>
                      <p className="text-[10px] text-text-muted">
                        {book.orderCount} historical orders
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-error px-1.5 py-0.5 text-[10px] font-bold text-white">
                      0
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low stock */}
          {lowStock.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-warning">
                <Package className="size-3.5" aria-hidden />
                Low Stock ({lowStock.length})
              </h4>
              <div className="space-y-1.5">
                {lowStock.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between rounded-control border border-warning/20 bg-warning-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-medium text-text">{book.title}</p>
                      <p className="text-[10px] text-text-muted">
                        {book.orderCount} historical orders
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-warning px-1.5 py-0.5 text-[10px] font-bold text-black">
                      {book.stockQuantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminCard>
  );
}
