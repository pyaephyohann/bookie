"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { useCartStore, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/mock-data";
import { createOrder, type CreateOrderResult } from "./actions";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout";

type FormStatus = "idle" | "submitting" | "success";

export function CheckoutClient() {
  const reduce = useReducedMotion() ?? false;
  const { items, clearCart, subtotal } = useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CheckoutFormData>({
    customerName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    shippingAddress: "",
    note: "",
  });

  const update = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on edit
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    // Client-side validation
    const clientParsed = checkoutSchema.safeParse(form);
    if (!clientParsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of clientParsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fe[field]) fe[field] = issue.message;
      }
      setFieldErrors(fe);
      setServerError("Please fix the errors below.");
      return;
    }

    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setStatus("submitting");
    setServerError(null);
    setFieldErrors({});

    const cartInput = items.map((i: CartItem) => ({
      bookId: i.bookId,
      quantity: i.quantity,
    }));

    const res = await createOrder(form, cartInput);

    if (res.success) {
      setResult(res);
      clearCart();
      setStatus("success");
    } else {
      setServerError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      setStatus("idle");
    }
  };

  // ── Empty cart ────────────────────────────────────────────────────────────

  if (items.length === 0 && status !== "success") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ShoppingBag className="mx-auto mb-4 size-16 text-text-muted opacity-40" aria-hidden />
          <h1 className="text-h2 font-bold text-text">Your cart is empty</h1>
          <p className="mt-2 text-body-lg text-text-secondary">
            Add some books to your cart before checking out.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
          >
            Browse Books
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (status === "success" && result) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={reduce ? {} : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md rounded-card border border-border bg-surface p-8 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="size-8 text-green-600 dark:text-green-400" aria-hidden />
          </div>
          <h1 className="text-h2 font-bold text-text">Order Created!</h1>
          <p className="mt-2 text-body-lg text-text-secondary">
            Your order has been received and is being processed.
          </p>

          <div className="mt-6 rounded-control border border-border bg-background p-4">
            <p className="text-caption uppercase text-text-muted">Your BookPass</p>
            <p className="mt-1 text-h2 font-bold text-brand">{result.bookPass}</p>
          </div>

          <p className="mt-4 text-body-sm text-text-muted">
            Use this BookPass to track your order status.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
            >
              Continue Shopping
            </Link>
            <Link
              href={`/track?pass=${result.bookPass}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-control border border-border bg-surface px-6 text-button text-text transition-colors hover:bg-surface-muted"
            >
              Track Order
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={reduce ? {} : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Cart
        </Link>
      </motion.div>

      <h1 className="text-h1 font-extrabold tracking-tight text-text">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate>
        {/* Server error banner */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
              role="alert"
            >
              <AlertCircle className="size-4 flex-shrink-0" aria-hidden />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Customer information */}
          <section aria-labelledby="customer-info-heading">
            <h2 id="customer-info-heading" className="text-h3 mb-6 font-bold text-text">
              Customer Information
            </h2>

            <div className="space-y-5">
              <FormField
                label="Full Name"
                required
                error={fieldErrors.customerName}
              >
                <Input
                  id="customerName"
                  name="customerName"
                  value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                  placeholder="e.g. Aung Myo"
                  autoComplete="name"
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.customerName}
                />
              </FormField>

              <FormField
                label="Phone Number"
                required
                error={fieldErrors.phone}
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="e.g. 09 123 456 789"
                  autoComplete="tel"
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.phone}
                />
              </FormField>

              <FormField
                label="Email"
                required
                error={fieldErrors.email}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="e.g. aung@example.com"
                  autoComplete="email"
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.email}
                />
              </FormField>

              <FormField
                label="Alternate Phone Number"
                error={fieldErrors.alternatePhone}
              >
                <Input
                  id="alternatePhone"
                  name="alternatePhone"
                  type="tel"
                  value={form.alternatePhone ?? ""}
                  onChange={(e) => update("alternatePhone", e.target.value)}
                  placeholder="Optional"
                  autoComplete="tel"
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.alternatePhone}
                />
              </FormField>

              <FormField
                label="Shipping Address"
                required
                error={fieldErrors.shippingAddress}
              >
                <Textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  value={form.shippingAddress}
                  onChange={(e) => update("shippingAddress", e.target.value)}
                  placeholder="Street, area, city, region"
                  rows={3}
                  autoComplete="street-address"
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.shippingAddress}
                />
              </FormField>

              <FormField
                label="Note"
                error={fieldErrors.note}
              >
                <Textarea
                  id="note"
                  name="note"
                  value={form.note ?? ""}
                  onChange={(e) => update("note", e.target.value)}
                  placeholder="Any special instructions? (optional)"
                  rows={2}
                  disabled={status === "submitting"}
                  aria-invalid={!!fieldErrors.note}
                />
              </FormField>
            </div>
          </section>

          {/* Order summary */}
          <section aria-labelledby="order-summary-heading" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="order-summary-heading" className="text-h3 mb-6 font-bold text-text">
              Order Summary
            </h2>

            <div className="rounded-card border border-border bg-surface p-6">
              {/* Items */}
              <ul className="divide-y divide-border">
                {items.map((item: CartItem) => (
                  <li key={item.bookId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-surface-muted">
                      {item.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImage}
                          alt={`Cover of ${item.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[0.5rem] text-text-muted">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-body-sm font-semibold text-text leading-snug line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-caption text-text-muted">{item.author}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-caption text-text-muted">
                          {formatPrice(item.price)} × {item.quantity}
                        </span>
                        <span className="text-body-sm font-semibold text-text">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <dl className="mt-4 space-y-3 border-t border-border pt-4 text-body-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Items ({totalItems})</dt>
                  <dd className="font-semibold text-text">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="text-body font-bold text-text">Total</dt>
                  <dd className="text-h3 font-bold text-text">{formatPrice(subtotal)}</dd>
                </div>
              </dl>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={status === "submitting"}
                whileTap={status === "submitting" ? undefined : { scale: 0.98 }}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-6 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-default disabled:opacity-70"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Placing Order…
                  </>
                ) : (
                  "Place Order"
                )}
              </motion.button>

              <p className="mt-3 text-center text-caption text-text-muted">
                You&apos;ll receive a BookPass after placing your order.
              </p>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

// ── Form field wrapper ──────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={undefined} className="mb-1.5 block text-body-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-caption text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
