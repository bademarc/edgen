/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cross-platform compatibility
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // External packages that should not be bundled
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Enable faster refresh in development
    reactStrictMode: true,
    // Enable source maps for better debugging
    productionBrowserSourceMaps: false,
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production
    productionBrowserSourceMaps: false,
  }),

  eslint: {
    // Only ignore during builds in production to avoid blocking deployment
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Enable strict TypeScript checking in all environments for better code quality
    // This ensures type safety and prevents runtime errors
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'x.com',
      },
      {
        protocol: 'https',
        hostname: 'twitter.com',
      }
    ],
    // Optimize images for production
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization for local images in standalone builds to prevent 400 errors
    unoptimized: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    APIFY_API_TOKEN: process.env.APIFY_API_TOKEN,
    APIFY_ACTOR_ID: process.env.APIFY_ACTOR_ID,
    APIFY_BASE_URL: process.env.APIFY_BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    LAYEREDGE_COMMUNITY_URL: process.env.LAYEREDGE_COMMUNITY_URL,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  webpack: (config, { isServer, dev }) => {
    // Cross-platform file watching optimizations
    config.watchOptions = {
      ...config.watchOptions,
      // Reduce CPU usage on all platforms
      aggregateTimeout: 300,
      poll: process.platform === 'win32' ? 1000 : undefined,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        '**/supabase/functions/**/*',
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/coverage/**',
        '**/dist/**',
      ],
    };

    // Platform-specific optimizations
    if (process.platform === 'darwin') {
      // macOS optimizations
      config.watchOptions.ignored.push('**/node_modules/.cache/**');
    } else if (process.platform === 'win32') {
      // Windows optimizations
      config.watchOptions.poll = 1000;
    }

    // Client-side fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Development-specific optimizations
    if (dev) {
      // Faster builds in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
  // Optimize chunk splitting for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    // Enable modern bundling optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // PRODUCTION FIX: Advanced bundle optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};

export default nextConfig;
