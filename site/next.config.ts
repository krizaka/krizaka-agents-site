import type { NextConfig } from "next";

/* A static site: `next build` writes out/ (HTML, CSS, JS), served as is by GitHub Pages — no server, no function. Every page
   has its own directory, so `/flow/` and `/flow` answer. English is at the root, French under /fr/. */
const nextConfig: NextConfig = {
  output: "export",
  // The default Pages URL (krizaka.github.io/krizaka-agents-site) serves the site under a path; the custom domain serves it at the root.
  basePath: process.env.SITE_BASE_PATH ?? "",
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
};

export default nextConfig;
