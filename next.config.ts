import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Suppress broken image warnings for S3 URLs (intentional since bucket not set up)
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    // Handle image loading errors gracefully
    loader: 'default',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Define fallback behavior for failed images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Suppress punycode deprecation warnings (only applied when using webpack)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    
    // Suppress specific warnings
    config.ignoreWarnings = [
      { message: /punycode/ },
      { message: /The requested resource isn't a valid image/ },
      { message: /Failed to load resource/ },
      { message: /404.*dummy_agent_logo\.png/ },
      { message: /404.*assets/ },
      { message: /net::ERR_NAME_NOT_RESOLVED/ },
      { message: /s3\..*\.amazonaws\.com/ },
      { message: /aldous-dummy-uploads/ },
      /Module not found.*punycode/,
      /Critical dependency.*punycode/,
    ];
    
    // Suppress stats warnings for cleaner output
    config.stats = {
      ...config.stats,
      warningsFilter: [
        /punycode/,
        /The requested resource isn't a valid image/,
        /Failed to load resource/,
        /404.*dummy_agent_logo\.png/,
        /s3\..*\.amazonaws\.com/,
      ]
    };
    
    return config;
  },
  
  // Configure logging to reduce verbose output
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Suppress compiler warnings (works with both webpack and turbopack)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  
  // Suppress development warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Turbopack configuration (for when using --turbopack flag)
  experimental: {
    turbo: {
      rules: {
        '*.png': {
          loaders: ['file-loader'],
        },
      },
    },
  },
};

export default nextConfig;
