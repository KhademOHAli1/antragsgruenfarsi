/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable SWC for faster builds
    swcMinify: true,
    // WebAssembly support
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    // WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Ignore .wasm files in server bundle to avoid conflicts
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(/\.wasm$/);
    }

    return config;
  },
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
  // PWA manifest
  manifest: {
    name: 'Antragsgrün',
    short_name: 'Antragsgrün',
    description: 'Motion and Amendment Management System',
    start_url: '/',
    display: 'standalone',
    theme_color: '#007AFF',
    background_color: '#ffffff',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  // Environment variables
  env: {
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:8000',
    RARIMO_ISSUER: process.env.RARIMO_ISSUER || 'https://auth.rarimo.com',
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // RTL support
  i18n: {
    locales: ['en', 'fa', 'de', 'fr'],
    defaultLocale: 'en',
    localeDetection: true,
  },
};

export default nextConfig;
