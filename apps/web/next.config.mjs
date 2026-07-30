/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages later; local uses Node next dev.
  // Optional same-origin proxy: set NEXT_PUBLIC_API_URL empty and call /api-proxy/*
  // async rewrites() {
  //   return [{ source: "/api-proxy/:path*", destination: "http://localhost:8787/:path*" }];
  // },
};

export default nextConfig;
