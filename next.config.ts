import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // Enable Cache Components for Next.js 16
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["app.localhost:3000", "*.localhost:3000"],
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
