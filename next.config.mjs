/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https: data:; font-src 'self' data: https:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: data: blob:; media-src 'self' https: data: blob:; frame-src 'self' https: blob:; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self';"
          }
        ]
      }
    ];
  },
  reactStrictMode: false,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  // Suppress specific hydration warnings in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  publicRuntimeConfig: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BASE_URL || '' 
      : '',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "net": false,
      "tls": false,
      "http": "stream-http",
      "https": "https-browserify",
      "stream": "stream-browserify",
      "crypto": "crypto-browserify",
      "zlib": "browserify-zlib",
      "path": "path-browserify",
      "buffer": "buffer",
      "querystring": "querystring-es3"
    };
    
    return config;
  },
  // Disable TypeScript checking in production builds
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable ESLint checking in production builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;