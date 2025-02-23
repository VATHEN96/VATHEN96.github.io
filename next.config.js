/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;"
          }
        ]
      }
    ];
  },
  reactStrictMode: true,
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
      "buffer": "buffer/",
      "querystring": "querystring-es3"
    };
    return config;
  }
};

export default nextConfig;