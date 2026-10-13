import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the VPS deploy (.github/workflows/deploy.yml).
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
  // The book's QR codes print /method/07. Send /method/7 to the same address.
  async redirects() {
    return [
      { source: "/method/:n(\\d)", destination: "/method/0:n", permanent: true },
      { source: "/method/:n(\\d)/:rest*", destination: "/method/0:n/:rest*", permanent: true },
    ];
  },
};

export default nextConfig;
