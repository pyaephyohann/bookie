"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  Home,
  MapPin,
  Package,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { METHOD_LABELS, type PaymentMethod } from "@/lib/payment";
import { formatPrice } from "@/lib/mock-data";
import { fadeUp } from "@/lib/motion";

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  bookTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  bookPass: string;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  note: string | null;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface PaymentData {
  method: PaymentMethod;
  amount: number;
  status: string;
  submittedAt: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrderCompleteClient({
  order,
  payment,
}: {
  order: OrderData;
  payment: PaymentData | null;
}) {
  const reduce = useReducedMotion() ?? false;

  const [copiedBookPass, setCopiedBookPass] = useState(false);
  const [copiedTrackingLink, setCopiedTrackingLink] = useState(false);

  // Build tracking URL
  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/track?pass=${order.bookPass}`
      : `/track?pass=${order.bookPass}`;

  // ── Copy helpers ──────────────────────────────────────────────────────

  const copyBookPass = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.bookPass);
      setCopiedBookPass(true);
    } catch {
      // Fallback: select text for manual copy
      const el = document.getElementById("bookpass-value");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [order.bookPass]);

  const copyTrackingLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedTrackingLink(true);
    } catch {
      // Fallback: select text for manual copy
      const el = document.getElementById("tracking-link-value");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [trackingUrl]);

  // Reset copy feedback after 2 seconds
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

  // ── Payment status text ───────────────────────────────────────────────

  const paymentStatusText = payment
    ? payment.status === "VERIFIED"
      ? "Payment Verified"
      : payment.status === "REJECTED"
        ? "Payment Rejected"
        : "Awaiting Verification"
    : "No Payment Submitted";

  const isPendingPayment =
    payment?.status === "PENDING";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Success header */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={reduce ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
        >
          <Check className="size-10 text-green-600 dark:text-green-400" aria-hidden />
        </motion.div>

        <h1 className="text-h1 font-extrabold tracking-tight text-text">
          Thank you for your order!
        </h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Your order has been submitted successfully.
        </p>
      </motion.div>

      {/* BookPass card */}
      <motion.div
        variants={fadeUp(reduce)}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="mt-8 rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <div className="text-center">
          <p className="text-caption uppercase text-text-muted">Your BookPass</p>
          <p
            id="bookpass-value"
            className="mt-2 text-display-sm font-extrabold tracking-tight text-brand select-all"
          >
            {order.bookPass}
          </p>
          <p className="mt-2 text-body-sm text-text-muted">
            Keep this BookPass to track your order status.
          </p>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={copyBookPass}
              aria-label={copiedBookPass ? "BookPass copied" : "Copy BookPass"}
            >
              {copiedBookPass ? (
                <>
                  <ClipboardCheck className="size-4" aria-hidden />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="size-4" aria-hidden />
                  Copy BookPass
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Payment status */}
      {payment && (
        <motion.div
          variants={fadeUp(reduce)}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption uppercase text-text-muted">Payment Status</p>
              <p className="mt-1 text-body font-semibold text-text">
                {paymentStatusText}
              </p>
            </div>
            <span className={`status ${payment.status === "VERIFIED" ? "status-success" : payment.status === "REJECTED" ? "status-error" : "status-pending"}`}>
              {payment.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-body-sm">
            <div>
              <p className="text-text-muted">Method</p>
              <p className="mt-0.5 font-semibold text-text">
                {METHOD_LABELS[payment.method]}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Amount</p>
              <p className="mt-0.5 font-semibold text-text">
                {formatPrice(payment.amount)}
              </p>
            </div>
          </div>

          {isPendingPayment && (
            <p className="mt-4 text-body-sm text-text-secondary">
              Your payment proof is being reviewed. We&apos;ll notify you once it&apos;s verified.
            </p>
          )}
        </motion.div>
      )}

      {/* Order summary */}
      <motion.div
        variants={fadeUp(reduce)}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.35 }}
        className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="text-h3 mb-4 font-bold text-text">Order Summary</h2>

        {/* Items */}
        <ul className="divide-y divide-border">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
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

        {/* Total */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-body font-bold text-text">Total</p>
          <p className="text-h3 font-bold text-text">{formatPrice(order.total)}</p>
        </div>
      </motion.div>

      {/* Shipping info */}
      <motion.div
        variants={fadeUp(reduce)}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="text-h3 mb-4 font-bold text-text">Shipping Details</h2>

        <div className="space-y-3 text-body-sm">
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 size-4 flex-shrink-0 text-text-muted" aria-hidden />
            <div>
              <p className="text-text-muted">Name</p>
              <p className="font-medium text-text">{order.customerName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 size-4 flex-shrink-0 text-text-muted" aria-hidden />
            <div>
              <p className="text-text-muted">Phone</p>
              <p className="font-medium text-text">{order.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 flex-shrink-0 text-text-muted" aria-hidden />
            <div>
              <p className="text-text-muted">Address</p>
              <p className="font-medium text-text whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tracking link */}
      <motion.div
        variants={fadeUp(reduce)}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.45 }}
        className="mt-4 rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="text-h3 mb-3 font-bold text-text">Track Your Order</h2>

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
            aria-label={copiedTrackingLink ? "Tracking link copied" : "Copy tracking link"}
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

          <Link
            href={`/track?pass=${order.bookPass}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-caption font-medium text-text transition-colors hover:bg-surface-muted"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open Tracking Page
          </Link>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        variants={fadeUp(reduce)}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
        >
          <Home className="size-4" aria-hidden />
          Continue Shopping
        </Link>

        <Link
          href={`/track?pass=${order.bookPass}`}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-control border border-border bg-surface px-6 text-button text-text transition-colors hover:bg-surface-muted"
        >
          <Package className="size-4" aria-hidden />
          Track Order
        </Link>
      </motion.div>
    </div>
  );
}
