import type { NextConfig } from "next";

/* A static site: `next build` writes out/ (HTML, CSS, JS), served as is by GitHub Pages — no server, no function. Every page
   has its own directory, so `/flow/` and `/flow` answer. English is at the root, French under /fr/. */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
};

export default nextConfig;
