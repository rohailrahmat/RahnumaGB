import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/chat": ["./data/index.json"],
    "/api/itinerary": ["./data/index.json"],
  },
};

export default nextConfig;