/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  // Using App Router route handler at /app/api/neus/[...path]/route.js for proxying
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  }
};

module.exports = nextConfig;
