/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Proxy client-side /api/* requests to the NestJS API.
  // Server components use API_URL env var directly;
  // this rewrite handles browser fetch() calls that use relative paths.
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
