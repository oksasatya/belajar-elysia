import type { NextConfig } from "next";

const EDEN_URL = process.env.EDEN_URL || `http://localhost:${process.env.EDEN_PORT || '8080'}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${EDEN_URL}/api/:path*` }
      ],
      afterFiles: [],
      fallback: []
    };
  }
};

export default nextConfig;
