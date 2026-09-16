import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./data/**", "./src/stocks/nifty500.json"],
    "/api/**": ["./data/**", "./src/stocks/nifty500.json"],
  },
};

export default nextConfig;
