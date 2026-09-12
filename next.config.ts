import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A3 catalog uploads travel to the server through Server Actions, whose
  // default body limit is 1 MB — below the 2 MB application-level image cap.
  // Without this, a 1–2 MB cover is rejected by the framework with a raw 413
  // before our own validation can show a friendly message. Keep this safely
  // above COVER_MAX_BYTES (2 MB); the real limit is still enforced server-side.
  // NOTE: in Next 16.3.x this key lives under `experimental`.
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    // Admins may point a book cover at an https image URL from the catalog
    // screen (A3). Uploaded covers are stored locally under /public/uploads.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
