import type { NextConfig } from "next";


//export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config
  staticPageGenerationTimeout: 120,
  
  // Temporarily skip prerendering for problematic pages
  // This is a workaround, not a permanent solution
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Exclude dashboard from prerendering
  output: 'standalone',
  experimental: {
    // This can help with database connections during build
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = {
  allowedDevOrigins: ['192.168.8.147'],
}

module.exports = nextConfig