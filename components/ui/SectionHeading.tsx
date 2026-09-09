"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Small handwritten Caveat annotation. */
  funNote?: string;
  action?: ReactNode;
  /** Optional extra node (e.g. an sr-only heading anchor). */
  children?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, funNote, action, children }: SectionHeadingProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={stagger(reduce, 0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <motion.div variants={fadeUp(reduce)} className="relative max-w-2xl">
        {eyebrow && (
          <p className="text-caption font-bold uppercase tracking-[0.16em] text-text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="text-h1 mt-1">{title}</h2>
        {description && <p className="text-body mt-2 text-text-secondary">{description}</p>}
        {funNote && (
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { rotate: [-2, 1.5, -2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="text-fun absolute -bottom-6 left-1 hidden text-2xl text-text-muted md:block"
          >
            <BookOpen className="mr-1 inline size-4" />
            {funNote}
          </motion.span>
        )}
      </motion.div>
      {action && (
        <motion.div variants={fadeUp(reduce)} className="shrink-0">
          {action}
        </motion.div>
      )}
      {children}
    </motion.div>
  );
}
