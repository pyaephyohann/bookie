"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, ArrowUp, Minus, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adjustStockAction, setStockAction } from "./actions";

// ── Action state type (exported for server actions) ────────────────────────

export interface InventoryActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

// ── Adjustment type config ─────────────────────────────────────────────────

const ADJUSTMENT_TYPES = [
  { value: "RESTOCK", label: "Restock", icon: ArrowUp, description: "Add units to inventory" },
  { value: "RETURN", label: "Return", icon: RotateCcw, description: "Customer return" },
  { value: "DAMAGE", label: "Damage", icon: AlertTriangle, description: "Remove damaged units" },
  { value: "ADJUSTMENT", label: "Manual", icon: Minus, description: "Manual correction" },
] as const;

// ── Pending button ─────────────────────────────────────────────────────────

function PendingButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" isLoading={pending} disabled={pending}>
      {children}
    </Button>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────

interface InventoryAdjustFormProps {
  bookId: string;
  currentStock: number;
}

export function InventoryAdjustForm({ bookId, currentStock }: InventoryAdjustFormProps) {
  const [adjustState, adjustDispatch] = useActionState(adjustStockAction, {} as InventoryActionState);
  const [setState, setDispatch] = useActionState(setStockAction, {} as InventoryActionState);

  const state = adjustState.error ? adjustState : setState;

  return (
    <div className="space-y-6">
      {/* Quick set stock */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-body font-semibold text-text">Set Stock Level</h3>
        <form action={setDispatch} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="bookId" value={bookId} />
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="set-quantity" className="mb-1 block text-caption text-text-secondary">
              New stock quantity
            </label>
            <input
              id="set-quantity"
              name="quantity"
              type="number"
              min={0}
              max={100000}
              defaultValue={currentStock}
              required
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {setState.fieldErrors?.quantity && (
              <p className="mt-1 text-caption text-error">{setState.fieldErrors.quantity}</p>
            )}
          </div>
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="set-note" className="mb-1 block text-caption text-text-secondary">
              Note (optional)
            </label>
            <input
              id="set-note"
              name="note"
              type="text"
              maxLength={500}
              placeholder="Reason for change"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <PendingButton>Set Stock</PendingButton>
        </form>
      </div>

      {/* Adjust stock */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-body font-semibold text-text">Adjust Stock</h3>
        <form action={adjustDispatch} className="space-y-3">
          <input type="hidden" name="bookId" value={bookId} />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ADJUSTMENT_TYPES.map((t) => (
              <label
                key={t.value}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-control border border-border p-3 text-center transition-colors hover:border-brand/50 has-[:checked]:border-brand has-[:checked]:bg-brand/10"
              >
                <input type="radio" name="type" value={t.value} className="sr-only" defaultChecked={t.value === "RESTOCK"} />
                <t.icon className="size-4 text-text-secondary" aria-hidden />
                <span className="text-caption font-medium text-text">{t.label}</span>
                <span className="text-[10px] text-text-muted">{t.description}</span>
              </label>
            ))}
          </div>
          {adjustState.fieldErrors?.type && (
            <p className="text-caption text-error">{adjustState.fieldErrors.type}</p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[120px]">
              <label htmlFor="adjust-quantity" className="mb-1 block text-caption text-text-secondary">
                Quantity
              </label>
              <input
                id="adjust-quantity"
                name="quantity"
                type="number"
                min={1}
                max={100000}
                defaultValue={1}
                required
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {adjustState.fieldErrors?.quantity && (
                <p className="mt-1 text-caption text-error">{adjustState.fieldErrors.quantity}</p>
              )}
            </div>
            <div className="min-w-[200px] flex-1">
              <label htmlFor="adjust-note" className="mb-1 block text-caption text-text-secondary">
                Note (optional)
              </label>
              <input
                id="adjust-note"
                name="note"
                type="text"
                maxLength={500}
                placeholder="Reason for adjustment"
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-body text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <PendingButton>Adjust</PendingButton>
          </div>
        </form>
      </div>

      {/* Global error */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-muted/40 p-3" role="alert">
          <Package className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
          <p className="text-body-sm text-error">{state.error}</p>
        </div>
      )}
    </div>
  );
}
