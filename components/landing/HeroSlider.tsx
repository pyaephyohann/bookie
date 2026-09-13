"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { formatPrice } from "@/lib/mock-data";
import type { HeroSlide } from "@/lib/data";

const AUTOPLAY_MS = 5000;

/**
 * Editorial hero showcase slider.
 * Auto-advances every 5s, pauses on hover/focus, and respects reduced motion.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || reduce) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [paused, reduce, slides.length]);

  const slide = slides[index];
  const direction = 1; // slides always advance forward; kept simple and calm

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Soft tinted stage */}
      <motion.div
        key={`tint-${slide.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute -inset-4 -z-10 rounded-[2rem] opacity-70 blur-2xl transition-colors duration-500 sm:-inset-6"
        style={{ backgroundColor: slide.tint }}
        aria-hidden
      />

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured books"
        className="relative overflow-hidden rounded-card border border-border bg-surface shadow-lg"
      >
        <div className="grid min-h-105 grid-cols-1 sm:min-h-96 sm:grid-cols-[1.2fr_1fr]">
          {/* Copy */}
          <div className="relative flex flex-col justify-center gap-4 p-7 sm:p-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * direction }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 * direction }}
                transition={{ duration: reduce ? 0.15 : 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex flex-col items-start gap-4"
              >
                <span className="rounded-full bg-brand px-3 py-1 text-caption font-bold uppercase tracking-wide text-brand-on">
                  {slide.eyebrow}
                </span>
                <h3 className="text-h1 font-extrabold leading-[1.05] tracking-tight">{slide.title}</h3>
                <p className="text-body text-text-secondary">
                  <span className="font-semibold text-text">{slide.author}</span> — {slide.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <motion.a
                    href={slide.linkUrl || (slide.bookSlug ? `/books/${slide.bookSlug}` : "#")}
                    whileHover={reduce ? undefined : { scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-control bg-ink px-5 py-2.5 text-button text-text-inverse transition-colors hover:bg-ink-hover"
                  >
                    {slide.compareAtPrice ? "Get the deal" : "Shop this book"}
                  </motion.a>
                  <span className="flex items-baseline gap-2">
                    <span className="text-h3 font-bold">{formatPrice(slide.price)}</span>
                    {slide.compareAtPrice && (
                      <span className="text-body-sm text-text-muted line-through">
                        {formatPrice(slide.compareAtPrice)}
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-auto flex items-center gap-3 pt-6">
              <SliderButton label="Previous slide" onClick={() => go(index - 1)}>
                <ChevronLeft className="size-4" aria-hidden />
              </SliderButton>
              <SliderButton label="Next slide" onClick={() => go(index + 1)}>
                <ChevronRight className="size-4" aria-hidden />
              </SliderButton>
              <SliderButton
                label={paused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
              </SliderButton>

              {/* Pagination dots */}
              <div className="ml-2 flex items-center gap-1.5" role="tablist" aria-label="Slides">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Slide ${i + 1}: ${s.title}`}
                    onClick={() => go(i)}
                    className="group p-1"
                  >
                    <motion.span
                      animate={{ width: i === index ? 22 : 8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`block h-1.5 rounded-full ${
                        i === index ? "bg-ink" : "bg-border-strong group-hover:bg-text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover */}
          <div className="relative hidden items-center justify-center bg-surface-muted p-8 sm:flex">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={slide.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 90, rotate: 4 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, rotate: -2 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60, rotate: 3 }}
                transition={{ duration: reduce ? 0.2 : 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-44 sm:w-52"
              >
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full rounded-card object-cover shadow-md"
                  />
                ) : (
                  <BookCover title={slide.title} author={slide.author} gradient={slide.cover} />
                )}
              </motion.div>
            </AnimatePresence>
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 shadow-xs"
            >
              <Star className="size-3.5 fill-brand stroke-ink/40" aria-hidden />
              <span className="text-caption font-bold">Reader favorite</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text"
    >
      {children}
    </motion.button>
  );
}
