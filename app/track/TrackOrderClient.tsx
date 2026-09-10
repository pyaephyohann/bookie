"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Check,
  Clipboard,
  ClipboardCheck,
  CreditCard,
  Home,
  Package,
  PackageSearch,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { METHOD_LABELS, type PaymentMethod } from "@/lib/payment";
import { formatPrice } from "@/lib/mock-data";
import { fadeUp } from "@/lib/motion";

// ── Types (server-serialised, no Prisma imports in the client) ────────────

export interface TrackOrderItem {
  bookTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface TrackPaymentData {
  method: PaymentMethod;
  amount: number;
  status: string;
  submittedAt: string;
}

export interface TrackOrderData {
  bookPass: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items: TrackOrderItem[];
  payment: TrackPaymentData | null;
  statusHistory: { status: string; at: string }[];
}

// ── Status presentation (client-safe, mirrors generated Prisma enums) ──────

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_SEMANTIC: Record<string, string> = {
  PLACED: "status-info",
  CONFIRMED: "status-success",
  REJECTED: "status-error",
  PREPARING: "status-pending",
  SHIPPED: "status-info",
  DELIVERED: "status-success",
  CANCELLED: "status-neutral",
};

const PAYMENT_STATUS_TEXT: Record<string, string> = {
  PENDING: "Awaiting Verification",
  VERIFIED: "Paid / Verified",
  REJECTED: "Payment Rejected",
};

const LIFECYCLE = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
] as const;

const TERMINAL_STATUSES = ["REJECTED", "CANCELLED"];

const lifecycleIndex = (status: string): number =>
  (LIFECYCLE as readonly string[]).indexOf(status);

// ── Helpers ────────────────────────────────────────────────────────────────

/** UTC-fixed formatting keeps server render and client hydration identical. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export function TrackOrderClient({
  initialPass,
  order,
  notFound,
}: {
  initialPass: string;
  order: TrackOrderData | null;
  notFound: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;

  const [pass, setPass] = useState(initialPass);
  const [searching, setSearching] = useState(false);
  const [copiedBookPass, setCopiedBookPass] = useState(false);
  const [copiedTrackingLink, setCopiedTrackingLink] = useState(false);

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/track?pass=${order?.bookPass}`
      : `/track?pass=${order?.bookPass}`;

  // ── Lookup ─────────────────────────────────────────────────────────────

  const submitLookup = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const normalized = pass.trim().toUpperCase();
      if (!normalized || searching) return;
      setSearching(true);
      router.push(`/track?pass=${encodeURIComponent(normalized)}`);
    },
    [pass, searching, router],
  );


  // ── Copy helpers ───────────────────────────────────────────────────────

  const copyBookPass = useCallback(async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.bookPass);
      setCopiedBookPass(true);
    } catch {
      const el = document.getElementById("bookpass-value");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [order]);

  const copyTrackingLink = useCallback(async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedTrackingLink(true);
    } catch {
      const el = document.getElementById("tracking-link-value");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [order, trackingUrl]);

  useEffect(() => {
    if (!copiedBookPass) return;
    const t = setTimeout(() => setCopiedBookPass(false), 2000);
    return () => clearTimeout(t);
  }, [copiedBookPass]);

  useEffect(() => {
    if (!copiedTrackingLink) return;
    const t = setTimeout(() => setCopiedTrackingLink(false), 2000);
    return () => clearTimeout(t);
  }, [copiedTrackingLink]);

  // ── Timeline derivation (actual server-side history, never fabricated) ──

  const historyByStatus = new Map(
    (order?.statusHistory ?? []).map((h) => [h.status, h.at]),
  );

  const isTerminal = order ? TERMINAL_STATUSES.includes(order.status) : false;
  const currentIndex = order ? lifecycleIndex(order.status) : -1;

  // Successful lifecycle: a step is completed when it is in the real history
  // or lies strictly before the authoritative current status. The current
  // status itself is always marked as reached (it comes from the database).
  const lifecycleSteps =
    !order || isTerminal
      ? []
      : LIFECYCLE.map((status) => {
          const idx = lifecycleIndex(status);
          const completed =
            historyByStatus.has(status) || (currentIndex >= 0 && idx < currentIndex);
          return {
            status,
            completed,
            current: status === order.status,
            at: historyByStatus.get(status) ?? null,
          };
        });

  // Terminal states (REJECTED / CANCELLED): show only the steps that actually
  // happened in history, then a terminal node — never future success steps.
  const terminalHistory =
    order && isTerminal
      ? LIFECYCLE.filter((status) => historyByStatus.has(status)).map(
          (status) => ({
            status,
            completed: true,
            current: false,
            at: historyByStatus.get(status) ?? null,
          }),
        )
      : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-h1 font-extrabold tracking-tight text-text">
          Track Your Order
        </h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Enter your BookPass to see where your order is.
        </p>
      </motion.div>

      {/* Lookup form */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <form onSubmit={submitLookup} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="bookpass-input" className="sr-only">
              BookPass
            </label>
            <Input
              id="bookpass-input"
              type="text"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="e.g. ORD-2026-001928"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="bookpass-hint"
              className="uppercase"
            />
          </div>
          <Button
            type="submit"
            size="md"
            disabled={searching}
            isLoading={searching}
            aria-label="Track order"
          >
            {!searching && <Search className="size-4" aria-hidden />}
            {searching ? "Searching…" : "Track Order"}
          </Button>
        </form>
        <p id="bookpass-hint" className="mt-2 text-caption text-text-muted">
          You received your BookPass when your order was created — for example{" "}
          <span className="font-semibold text-text">ORD-2026-001928</span>.
        </p>
      </motion.div>

      {/* Not found state */}
      {notFound && !order && (
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          role="status"
          className="mt-4 rounded-card border border-error bg-error/5 p-6 text-center"
        >
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-error/10">
            <AlertCircle className="size-5 text-error" aria-hidden />
          </span>
          <p className="mt-3 text-body font-semibold text-text">
            We couldn&apos;t find an order with that BookPass.
          </p>
          <p className="mt-1 text-body-sm text-text-secondary">
            Double-check the BookPass from your order confirmation and try again.
          </p>
        </motion.div>
      )}

      {/* Tracking result */}
      {order && (
        <>
          {/* Status header */}
          <motion.div
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
            className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-caption uppercase text-text-muted">
                  Your BookPass
                </p>
                <p
                  id="bookpass-value"
                  className="mt-1 text-display-sm font-extrabold tracking-tight text-brand select-all"
                >
                  {order.bookPass}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-body-sm text-text-muted">
                  <Calendar className="size-3.5" aria-hidden />
                  Ordered {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span
                  className={`status ${
                    STATUS_SEMANTIC[order.status] ?? "status-neutral"
                  }`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyBookPass}
                  aria-label={
                    copiedBookPass ? "BookPass copied" : "Copy BookPass"
                  }
                >
                  {copiedBookPass ? (
                    <>
                      <ClipboardCheck className="size-3.5" aria-hidden />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="size-3.5" aria-hidden />
                      Copy BookPass
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Status timeline */}
          <motion.div
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <h2 className="text-h3 mb-5 font-bold text-text">
              Order Status
            </h2>

            {isTerminal ? (
              <div>
                {terminalHistory.length > 0 && (
                  <ol className="relative space-y-6">
                    {terminalHistory.map((step, i) => (
                      <TimelineRow
                        key={step.status}
                        status={step.status}
                        at={step.at}
                        state="completed"
                        isLast={i === terminalHistory.length - 1}
                      />
                    ))}
                  </ol>
                )}

                <div className="mt-6 rounded-control border border-error bg-error/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-error text-white">
                      <X className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-body font-semibold text-text">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </p>
                      <p className="mt-0.5 text-body-sm text-text-secondary">
                        {order.status === "REJECTED"
                          ? "This order was rejected and will not continue through preparation, shipping, or delivery. Contact us if you believe this is a mistake."
                          : "This order was cancelled and will not be processed."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ol className="relative space-y-6">
                {lifecycleSteps.map((step, i) => (
                  <TimelineRow
                    key={step.status}
                    status={step.status}
                    at={step.at}
                    state={
                      step.current
                        ? "current"
                        : step.completed
                          ? "completed"
                          : "upcoming"
                    }
                    isLast={i === lifecycleSteps.length - 1}
                  />
                ))}
              </ol>
            )}
          </motion.div>

          {/* Payment status */}
          {order.payment && (
            <motion.div
              variants={fadeUp(reduce)}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
              className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="size-4 text-text-muted" aria-hidden />
                  <h2 className="text-h3 font-bold text-text">Payment</h2>
                </div>
                <span
                  className={`status ${
                    order.payment.status === "VERIFIED"
                      ? "status-success"
                      : order.payment.status === "REJECTED"
                        ? "status-error"
                        : "status-pending"
                  }`}
                >
                  {order.payment.status}
                </span>
              </div>

              <p className="mt-3 text-body text-text">
                {PAYMENT_STATUS_TEXT[order.payment.status] ??
                  order.payment.status}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-text-muted">Method</p>
                  <p className="mt-0.5 font-semibold text-text">
                    {METHOD_LABELS[order.payment.method]}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Amount</p>
                  <p className="mt-0.5 font-semibold text-text">
                    {formatPrice(order.payment.amount)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-caption text-text-muted">
                Submitted {formatDateTime(order.payment.submittedAt)} (UTC)
              </p>

              {order.payment.status === "PENDING" && (
                <p className="mt-3 text-body-sm text-text-secondary">
                  Your payment proof is being reviewed. We&apos;ll update the
                  order status once it&apos;s verified.
                </p>
              )}
            </motion.div>
          )}

          {/* Order summary */}
          <motion.div
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <h2 className="text-h3 mb-4 font-bold text-text">Order Summary</h2>

            <ul className="divide-y divide-border">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-text leading-snug line-clamp-2">
                      {item.bookTitle}
                    </p>
                    <p className="mt-0.5 text-caption text-text-muted">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-body-sm font-semibold text-text whitespace-nowrap">
                    {formatPrice(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-body-sm">
              <div className="flex items-center justify-between">
                <p className="text-text-muted">Subtotal</p>
                <p className="font-medium text-text">
                  {formatPrice(order.subtotal)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-text-muted">Shipping</p>
                <p className="font-medium text-text">
                  {formatPrice(order.shippingFee)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-body font-bold text-text">Total</p>
                <p className="text-h3 font-bold text-text">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tracking link + navigation */}
          <motion.div
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.35 }}
            className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
          >
            <h2 className="text-h3 mb-3 font-bold text-text">
              Bookmark This Page
            </h2>

            <div className="flex items-center gap-2 rounded-control border border-border bg-background px-3 py-2">
              <span
                id="tracking-link-value"
                className="min-w-0 flex-1 truncate text-body-sm text-text-secondary select-all"
              >
                {trackingUrl}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyTrackingLink}
                aria-label={
                  copiedTrackingLink
                    ? "Tracking link copied"
                    : "Copy tracking link"
                }
              >
                {copiedTrackingLink ? (
                  <>
                    <ClipboardCheck className="size-3.5" aria-hidden />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="size-3.5" aria-hidden />
                    Copy Tracking Link
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPass(order.bookPass);
                }}
              >
                <PackageSearch className="size-3.5" aria-hidden />
                Check Another Order
              </Button>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
          >
            <Home className="size-4" aria-hidden />
            Continue Shopping
          </Link>
          </motion.div>
        </>
      )}

      {/* Empty state when no lookup was performed yet */}
      {!order && !notFound && (
        <motion.div
          initial={reduce ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center"
        >
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-surface-muted">
            <Package className="size-5 text-text-muted" aria-hidden />
          </span>
          <p className="mt-3 text-body font-semibold text-text">
            No order loaded yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-body-sm text-text-muted">
            Enter the BookPass from your order confirmation above to see the
            latest status.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Timeline row ───────────────────────────────────────────────────────────

function TimelineRow({
  status,
  at,
  state,
  isLast,
}: {
  status: string;
  at: string | null;
  state: "completed" | "current" | "upcoming";
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-4">
      {/* Connector */}
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-4 top-10 h-[calc(100%-2.5rem)] w-px ${
            state === "upcoming" ? "bg-border-subtle" : "bg-border-strong"
          }`}
        />
      )}

      {/* Node */}
      <span
        aria-hidden
        className={`relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border ${
          state === "completed"
            ? "border-transparent bg-brand text-black"
            : state === "current"
              ? "border-brand bg-surface text-brand"
              : "border-border bg-surface-muted text-text-disabled"
        }`}
      >
        {state === "completed" ? (
          <Check className="size-4" strokeWidth={3} />
        ) : state === "current" ? (
          <span className="size-2.5 rounded-full bg-brand" />
        ) : (
          <span className="size-2.5 rounded-full bg-current" />
        )}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-1">
        <p
          className={`text-body font-semibold ${
            state === "upcoming"
              ? "text-text-muted"
              : state === "current"
                ? "text-text"
                : "text-text"
          }`}
          {...(state === "current" ? { "aria-current": "step" as const } : {})}
        >
          {STATUS_LABELS[status] ?? status}
          {state === "current" && (
            <span className="ml-2 inline-flex items-center gap-1 text-caption font-medium text-text-secondary">
              <span className="status status-info">Current</span>
            </span>
          )}
        </p>
        {at && (
          <p className="mt-0.5 text-caption text-text-muted">
            {formatDateTime(at)} (UTC)
          </p>
        )}
      </div>
    </li>
  );
}