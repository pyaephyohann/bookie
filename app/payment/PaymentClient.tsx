"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  FileImage,
  Phone,
  QrCode,
  Replace,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type PaymentMethod,
  METHOD_LABELS,
  getMerchantInfo,
  PAYMENT_METHODS,
} from "@/lib/payment";
import { formatPrice } from "@/lib/mock-data";
import { fadeUp } from "@/lib/motion";
import { submitPayment } from "./actions";

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
  email: string;
  items: OrderItem[];
  total: number;
  status: string;
  hasPendingPayment: boolean;
}

type PaymentStatus = "idle" | "submitting" | "success" | "error";

// ── Component ──────────────────────────────────────────────────────────────

export function PaymentClient({ order }: { order: OrderData }) {
  const reduce = useReducedMotion() ?? false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<PaymentMethod>("KPAY");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Current merchant info based on selected method
  const merchant = getMerchantInfo(method);

  // ── File handling ──────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (!file) return;

      // Client-side pre-validation
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (JPEG, PNG, or WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5 MB.");
        return;
      }

      setError(null);
      setSlipFile(file);

      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [],
  );

  const removeFile = useCallback(() => {
    setSlipFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    if (!slipFile) {
      setError("Please upload a payment slip before submitting.");
      return;
    }

    setStatus("submitting");
    setError(null);

    const result = await submitPayment({
      bookPass: order.bookPass,
      method,
      slipFile,
    });

    if (result.success) {
      router.push(`/order/complete?bookPass=${order.bookPass}`);
    } else {
      setError(result.error);
      setStatus("idle");
    }
  };

  // ── Already paid state ────────────────────────────────────────────────
  // Redirect to the completion page if payment already exists

  if (order.hasPendingPayment && status !== "success") {
    router.push(`/order/complete?bookPass=${order.bookPass}`);
    return null;
  }

  // ── Payment form ──────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <Link
          href="/checkout"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Checkout
        </Link>
      </motion.div>

      <h1 className="text-h1 font-extrabold tracking-tight text-text">
        Payment
      </h1>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 rounded-control border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="size-4 flex-shrink-0" aria-hidden />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left column: payment form */}
          <div className="space-y-8">
            {/* Payment method selection */}
            <motion.section
              variants={fadeUp(reduce)}
              initial="hidden"
              animate="visible"
              aria-labelledby="payment-method-heading"
            >
              <h2
                id="payment-method-heading"
                className="text-h3 mb-4 font-bold text-text"
              >
                Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setError(null);
                    }}
                    className={`flex items-center gap-3 rounded-card border-2 p-4 text-left transition-all ${
                      method === m
                        ? "border-brand bg-brand-muted shadow-xs"
                        : "border-border bg-surface hover:border-border-strong"
                    }`}
                    aria-pressed={method === m}
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-full ${
                        method === m
                          ? "bg-brand text-brand-on"
                          : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      {m === "KPAY" ? (
                        <Phone className="size-5" aria-hidden />
                      ) : (
                        <CreditCard className="size-5" aria-hidden />
                      )}
                    </span>
                    <div>
                      <p className="text-body font-semibold text-text">
                        {METHOD_LABELS[m]}
                      </p>
                      <p className="text-caption text-text-muted">
                        Mobile payment
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>

            {/* Payment instructions */}
            <motion.section
              variants={fadeUp(reduce)}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              aria-labelledby="payment-instructions-heading"
            >
              <h2
                id="payment-instructions-heading"
                className="text-h3 mb-4 font-bold text-text"
              >
                {METHOD_LABELS[method]} Payment Details
              </h2>

              <div className="rounded-card border border-border bg-surface p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-caption uppercase text-text-muted">
                      Account Name
                    </p>
                    <p className="mt-1 text-body font-semibold text-text">
                      {merchant.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption uppercase text-text-muted">
                      Phone Number
                    </p>
                    <p className="mt-1 text-body font-semibold text-text">
                      {merchant.phone}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-body-sm text-text-secondary">
                    Scan the QR code or send payment to the account above.
                  </p>
                </div>

                {/* QR image area */}
                {merchant.qrUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative size-48 overflow-hidden rounded-card border border-border bg-surface-muted">
                      <Image
                        src={merchant.qrUrl}
                        alt={`${METHOD_LABELS[method]} QR code`}
                        fill
                        className="object-contain p-2"
                        sizes="192px"
                      />
                    </div>
                  </div>
                )}

                {!merchant.qrUrl && (
                  <div className="mt-4 flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-muted p-6">
                    <QrCode
                      className="mb-2 size-10 text-text-muted opacity-40"
                      aria-hidden
                    />
                    <p className="text-body-sm text-text-muted">
                      QR code not configured yet
                    </p>
                    <p className="text-caption text-text-disabled">
                      Send payment to the phone number above
                    </p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Payment slip upload */}
            <motion.section
              variants={fadeUp(reduce)}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              aria-labelledby="slip-upload-heading"
            >
              <h2
                id="slip-upload-heading"
                className="text-h3 mb-4 font-bold text-text"
              >
                Upload Payment Slip
              </h2>

              <div className="rounded-card border border-border bg-surface p-6">
                <p className="text-body-sm text-text-secondary mb-4">
                  Take a screenshot of your payment confirmation and upload it
                  here.
                </p>

                {/* File input area */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="slip-upload"
                    aria-label="Upload payment slip image"
                  />

                  <AnimatePresence mode="wait">
                    {previewUrl ? (
                      <motion.div
                        key="preview"
                        initial={reduce ? {} : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative overflow-hidden rounded-card border border-border bg-background"
                      >
                        <div className="relative aspect-video w-full">
                          <Image
                            src={previewUrl}
                            alt="Payment slip preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-border px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileImage
                              className="size-4 flex-shrink-0 text-text-muted"
                              aria-hidden
                            />
                            <span className="text-body-sm text-text truncate">
                              {slipFile?.name}
                            </span>
                            <span className="text-caption text-text-muted flex-shrink-0">
                              ({formatFileSize(slipFile?.size ?? 0)})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <label
                              htmlFor="slip-upload"
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-caption font-medium text-text transition-colors hover:bg-surface-muted"
                            >
                              <Replace className="size-3.5" aria-hidden />
                              Replace
                            </label>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="inline-flex h-8 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-caption font-medium text-text transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                              aria-label="Remove payment slip"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.label
                        key="upload"
                        htmlFor="slip-upload"
                        initial={reduce ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-surface-muted p-10 transition-colors hover:border-brand hover:bg-brand-muted/30"
                      >
                        <span className="flex size-12 items-center justify-center rounded-full bg-surface">
                          <Upload
                            className="size-6 text-text-muted"
                            aria-hidden
                          />
                        </span>
                        <div className="text-center">
                          <p className="text-body font-semibold text-text">
                            Tap to upload payment slip
                          </p>
                          <p className="mt-1 text-caption text-text-muted">
                            JPEG, PNG, or WEBP — max 5 MB
                          </p>
                        </div>
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right column: order summary */}
          <motion.section
            variants={fadeUp(reduce)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
            aria-labelledby="order-summary-heading"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <h2
              id="order-summary-heading"
              className="text-h3 mb-6 font-bold text-text"
            >
              Order Summary
            </h2>

            <div className="rounded-card border border-border bg-surface p-6">
              {/* BookPass */}
              <div className="mb-4 rounded-control border border-border bg-background p-3 text-center">
                <p className="text-caption uppercase text-text-muted">
                  BookPass
                </p>
                <p className="mt-0.5 text-body font-bold text-brand">
                  {order.bookPass}
                </p>
              </div>

              {/* Items */}
              <ul className="divide-y divide-border">
                {order.items.map((item, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-body-sm font-semibold text-text leading-snug line-clamp-2">
                      {item.bookTitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-caption text-text-muted">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </span>
                      <span className="text-body-sm font-semibold text-text">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Total */}
              <dl className="mt-4 space-y-3 border-t border-border pt-4 text-body-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-body font-bold text-text">
                    Amount Due
                  </dt>
                  <dd className="text-h3 font-bold text-text">
                    {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                isLoading={status === "submitting"}
                disabled={!slipFile || status === "submitting"}
                className="mt-6"
              >
                {status === "submitting"
                  ? "Submitting Payment…"
                  : "Submit Payment"}
              </Button>

              <p className="mt-3 text-center text-caption text-text-muted">
                Your payment will be verified by our team.
              </p>
            </div>
          </motion.section>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
