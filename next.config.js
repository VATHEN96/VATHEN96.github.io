/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['wowzarush.com', 'res.cloudinary.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.plugins = config.resolve.plugins || [];
    
    config.module.rules.push({
      test: /WowzaRush\.json$/,
      use: [
        {
          loader: 'cache-loader',
          options: {
            cacheIdentifier: 'WowzaRush-v1',
          },
        },
      ],
    });
    
    return config;
  },
};

module.exports = nextConfig; 