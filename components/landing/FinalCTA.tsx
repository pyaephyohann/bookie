"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { viewportOnce } from "@/lib/motion";

export function FinalCTA() {
  const reduce = useReducedMotion() ?? false;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("loading");
    // Mock subscribe — no backend yet.
    window.setTimeout(() => setState("done"), 700);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="final-cta-heading">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative overflow-hidden rounded-card border border-border bg-surface px-6 py-14 text-center shadow-sm sm:px-12"
      >
        {/* Decorative brand glow + shelf line */}
        <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-brand-muted/60 blur-3xl dark:bg-brand/10" />
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="text-fun absolute right-8 top-6 hidden text-2xl text-text-muted md:block"
        >
          one more chapter →
        </motion.span>

        <div className="relative mx-auto max-w-xl">
          <h2 id="final-cta-heading" className="text-display-sm font-extrabold tracking-tight">
            Find a book worth remembering.
          </h2>
          <p className="text-body-lg mt-4 text-text-secondary">
            Get one thoughtful recommendation a week — new releases, hidden gems
            and the occasional deal. No spam, unsubscribe anytime.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-disabled" aria-hidden />
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                placeholder="you@example.com"
                aria-invalid={state === "error"}
                className="h-12 w-full rounded-control border border-border bg-background pl-9 pr-3 text-body text-text placeholder:text-text-disabled transition-colors hover:border-border-strong focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-error"
              />
            </div>
            <motion.button
              type="submit"
              disabled={state === "loading" || state === "done"}
              whileTap={state === "idle" ? { scale: 0.97 } : undefined}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-ink px-6 text-button text-text-inverse transition-colors hover:bg-ink-hover disabled:cursor-default disabled:opacity-70"
            >
              {state === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : state === "done" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                "Subscribe"
              )}
              {state === "idle" && <ArrowRight className="size-4" aria-hidden />}
            </motion.button>
          </form>

          <div aria-live="polite" className="mt-3 min-h-5 text-body-sm">
            {state === "error" && <p className="text-error">Please enter a valid email address.</p>}
            {state === "done" && (                <p className="text-success">You&apos;re in! First letter arrives this Friday.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.a
              href="#trending"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-control bg-brand px-6 py-3 text-button text-brand-on shadow-sm transition-colors hover:bg-brand-hover"
            >
              Browse Books
              <ArrowRight className="size-4" aria-hidden />
            </motion.a>
            <span className="text-caption text-text-muted">Free delivery over $35 · Guest checkout</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
