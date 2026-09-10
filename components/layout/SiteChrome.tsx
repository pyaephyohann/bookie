"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";

/**
 * Site chrome wrapper.
 *
 * The reader (`/books/[slug]/read`) intentionally hides the navbar, footer and
 * floating cart so reading stays calm and focused — the reader provides its own
 * back navigation. Everywhere else the normal chrome renders.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isReader = /^\/books\/[^/]+\/read$/.test(pathname ?? "");

  return (
    <>
      {!isReader && <Navbar />}
      {children}
      {!isReader && <Footer />}
      {!isReader && <FloatingCart />}
    </>
  );
}