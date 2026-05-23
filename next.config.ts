import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  allowedDevOrigins: ['192.168.8.147'],
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // Image optimization
  images: {
    unoptimized: false,
  },
  
  // Turbopack config (empty is fine)
  turbopack: {},
  
  // Remove custom headers for now to avoid warnings
  // Add them back gradually once the build works
};

export default nextConfig;