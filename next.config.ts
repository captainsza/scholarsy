import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Keep other existing configuration if any
  webpack: (config, { isServer }) => {
    // If client-side (browser) bundle
    if (!isServer) {
      // Replace Node.js modules that Cloudinary depends on with empty objects
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        url: false,
        stream: false,
        util: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
