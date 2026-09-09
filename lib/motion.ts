import type { Variants } from "framer-motion";

/**
 * Shared motion primitives for the Bookie landing page.
 * Every helper takes `reduce` (from useReducedMotion) so users who prefer
 * reduced motion get an instant, opacity-only experience.
 */

export const EASE_OUT: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

export function fadeUp(reduce: boolean, distance = 24): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.55, ease: EASE_OUT },
    },
  };
}

export function stagger(reduce: boolean, delay = 0.08): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : delay, delayChildren: reduce ? 0 : 0.05 },
    },
  };
}

export const viewportOnce = { once: true, margin: "-80px" } as const;
