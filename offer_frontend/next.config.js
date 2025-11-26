/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Webpack configuration for performance
  webpack: (config, { isServer, dev }) => {
    // Skip complex optimizations in development
    if (dev) {
      return config;
    }

    // Remove console logs in production only
    config.optimization.minimizer = config.optimization.minimizer || [];
    const TerserPlugin = require('terser-webpack-plugin');
    config.optimization.minimizer.push(
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      })
    );

    // Code splitting for production
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 20,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
  
  // Enable CSS source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  // Image domains for production
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Enable TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Enable ESLint checking
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Development optimizations
  devIndicators: {
    buildActivityPosition: 'bottom-right',
  },
}

module.exports = nextConfig
