"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { BOOKIE_PASS_EXAMPLE, formatPrice, MOCK_BOOKS } from "@/lib/mock-data";

const PASS = BOOKIE_PASS_EXAMPLE;

export function BookPassFeature() {
  const reduce = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PASS);
    } catch {
      // Clipboard can be unavailable — visual feedback is enough for the demo.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="bookpass" className="scroll-mt-24 border-y border-border bg-surface py-16" aria-labelledby="bookpass-heading">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Copy */}
        <motion.div variants={stagger(reduce)} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.p variants={fadeUp(reduce, 12)} className="text-caption font-bold uppercase tracking-[0.16em] text-text-muted">
            BookPass
          </motion.p>
          <motion.h2 id="bookpass-heading" variants={fadeUp(reduce)} className="text-h1 mt-2 font-extrabold tracking-tight">
            No account. No password.
            <span className="text-fun ml-3 inline-block text-3xl font-semibold text-text-muted">just your BookPass.</span>
          </motion.h2>
          <motion.p variants={fadeUp(reduce)} className="text-body-lg mt-4 max-w-md text-text-secondary">
            The moment your order is placed, Bookie hands you a BookPass — a short
            code that is your order. Paste it on the tracking page any time to see
            exactly where your books are.
          </motion.p>
          <motion.ul variants={fadeUp(reduce)} className="mt-6 space-y-2.5">
            {[
              "Order as a guest — no sign-up",
              "One code for the whole order",
              "Live status from PLACED to DELIVERED",
            ].map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-body text-text-secondary">
                <CheckCircle2 className="size-4.5 shrink-0 text-success" aria-hidden />
                {point}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Visual: order confirmation / tracking card */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, rotate: 1 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative mx-auto w-full max-w-md"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -9, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative rounded-card border border-border bg-surface-elevated p-6 shadow-lg"
          >
            {/* Stamp */}
            <motion.span
              aria-hidden
              initial={reduce ? false : { scale: 2.4, opacity: 0, rotate: -18 }}
              whileInView={{ scale: 1, opacity: 1, rotate: -8 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 16 }}
              className="absolute -right-3 -top-4 rounded-lg border-2 border-brand px-3 py-1 text-caption font-extrabold uppercase tracking-widest text-ink shadow-xs dark:text-brand-on"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              Confirmed
            </motion.span>

            <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
              Order confirmed · Today, 14:32
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-control border border-dashed border-border-strong bg-surface p-3.5">
              <div>
                <p className="text-caption text-text-muted">Your BookPass</p>
                <p className="font-mono text-h3 font-bold tracking-wide text-text">{PASS}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                aria-live="polite"
                className="flex size-10 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text"
                aria-label={copied ? "BookPass copied" : `Copy BookPass ${PASS}`}
              >
                <Copy className="size-4" aria-hidden />
              </button>
            </div>

            {/* Items */}
            <ul className="mt-4 space-y-2.5">
              {MOCK_BOOKS.slice(0, 2).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-body-sm">
                  <span className="truncate text-text-secondary">
                    <span className="font-semibold text-text">{b.title}</span> · {b.author}
                  </span>
                  <span className="shrink-0 font-semibold text-text">{formatPrice(b.price)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3.5">
              <span className="text-caption text-text-muted">2 items · Pay on delivery</span>
              <span className="text-h4 font-bold">{formatPrice(40.5)}</span>
            </div>

            {/* Status timeline */}
            <div className="mt-4 flex items-center" aria-label="Order status: confirmed">
              {["Placed", "Confirmed", "Preparing", "Shipped", "Delivered"].map((step, i) => (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + i * 0.12, type: "spring", stiffness: 300, damping: 18 }}
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[0.5625rem] font-bold ${
                      i < 2 ? "bg-success text-white" : "bg-surface-muted text-text-disabled"
                    }`}
                    aria-hidden
                  >
                    {i < 2 ? "✓" : i + 1}
                  </motion.span>
                  {i < 4 && (
                    <motion.span
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: i === 0 ? 1 : 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.85 + i * 0.12, duration: 0.35 }}
                      className={`h-0.5 flex-1 origin-left rounded-full ${i === 0 ? "bg-success" : "bg-border"}`}
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-fun mt-4 text-center text-2xl text-text-muted" aria-hidden>
            keep this code, that&apos;s the whole trick
          </p>
        </motion.div>
      </div>
    </section>
  );
}
