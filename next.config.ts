import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy. Everything is served from this origin: no third-party scripts, fonts,
// frames or beacons. 'unsafe-inline' scripts stay because the prerendered (cached, partially
// prerendered) pages carry Next.js's inline bootstrap and our pre-paint script, and a per-request
// nonce would force every page to render dynamically. The XSS surface is kept small instead: React
// escapes all text, no user data reaches dangerouslySetInnerHTML, and user URLs pass lib/safe-url.
// upgrade-insecure-requests and HSTS are added by the TLS front (Caddy), so plain-HTTP previews work.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // a self-contained server for the Docker image (see Dockerfile)
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The book's QR codes print /method/07. Send /method/7 to the same address.
  async redirects() {
    return [
      { source: "/method/:n(\\d)", destination: "/method/0:n", permanent: true },
      { source: "/method/:n(\\d)/:rest*", destination: "/method/0:n/:rest*", permanent: true },
    ];
  },
};

export default nextConfig;
