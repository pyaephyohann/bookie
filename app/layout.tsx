import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

// Decorative font only — the primary UI font (Scoutie Sans) is self-hosted
// via @fontsource-variable/scoutie-sans and wired in app/globals.css.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bookie",
  description: "Bookie — online bookstore",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
