import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Only use static export in production to allow hot reloading in dev
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // In development, watch the content directory for changes
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
        ],
        poll: 1000, // Check for changes every second
      };
    }
    return config;
  },
};

export default nextConfig;
