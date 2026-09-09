"use client";

import { motion } from "framer-motion";

/**
 * Placeholder cover art — a deterministic CSS/SVG composition per book.
 * Replace with real <Image> covers when the catalogue is connected.
 */

interface BookCoverProps {
  title: string;
  author: string;
  gradient: [string, string];
  className?: string;
}

export function BookCover({ title, author, gradient, className = "" }: BookCoverProps) {
  const seed = title.length + title.charCodeAt(0);
  const bands = 3 + (seed % 3);

  return (
    <div
      className={`relative flex aspect-2/3 w-full flex-col justify-between overflow-hidden rounded-md p-3 shadow-md ${className}`}
      style={{ backgroundImage: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})` }}
    >
      {/* Decorative geometry, varied per title */}
      <svg aria-hidden className="absolute inset-0 size-full opacity-20" viewBox="0 0 200 300" preserveAspectRatio="none">
        {Array.from({ length: bands }).map((_, i) => (
          <circle
            key={i}
            cx={30 + ((seed * (i + 3)) % 140)}
            cy={40 + ((seed * 7 * (i + 1)) % 220)}
            r={18 + ((seed * (i + 2)) % 40)}
            fill="#fff449"
            opacity={0.10 + i * 0.05}
          />
        ))}
        <rect x={0} y={0} width={10} height={300} fill="#000" opacity={0.25} />
      </svg>

      <div className="relative flex flex-1 flex-col items-center justify-center px-1 text-center">
        <span className="line-clamp-4 font-semibold leading-snug text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">
          {title}
        </span>
      </div>

      <div className="relative text-center">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-white/70">
          {author}
        </span>
      </div>
    </div>
  );
}

/** Compact inline cover for sliders/menus. */
export function MiniBookCover({
  title,
  gradient,
  className = "",
}: {
  title: string;
  gradient: [string, string];
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={`relative flex aspect-2/3 items-end overflow-hidden rounded-md shadow-md ${className}`}
      style={{ backgroundImage: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})` }}
    >
      <div className="w-full bg-black/25 px-2 py-1.5 backdrop-blur-[2px]">
        <span className="line-clamp-2 text-[0.625rem] font-semibold leading-tight text-white">{title}</span>
      </div>
    </motion.div>
  );
}
