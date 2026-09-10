import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeContext";

// Decorative font only — the primary UI font (Scoutie Sans) is self-hosted
// via @fontsource-variable/scoutie-sans and wired in app/globals.css.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bookie — Discover your next favorite book",
  description:
    "Bookie is an independent online bookstore. Browse, read online and order without an account — track everything with your BookPass.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${caveat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Sets the theme class before first paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SiteChrome>
            <main id="main" className="flex-1">
              {children}
            </main>
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
