"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "./ThemeContext";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const ActiveIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={ActiveIcon.displayName ?? String(ActiveIcon)}
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="flex"
          >
            <ActiveIcon className="size-[18px]" aria-hidden />
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Theme"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-11 z-50 w-36 rounded-card border border-border bg-surface-elevated p-1 shadow-md"
          >
            {OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={theme === value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-body-sm transition-colors ${
                  theme === value
                    ? "bg-surface-muted font-semibold text-text"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
