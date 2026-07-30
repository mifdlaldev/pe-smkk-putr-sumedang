import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pe-smkk/shared"],
  // Cloudflare Pages / OpenNext adapter wired in a later task.
};

export default nextConfig;
