import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable experimental features for Next.js 15
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Disable type checking during build (we'll run it separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
